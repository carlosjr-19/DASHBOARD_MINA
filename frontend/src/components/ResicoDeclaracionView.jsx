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
import PillSelect from './PillSelect';
import PillDatePicker from './PillDatePicker';

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
    <div className="space-y-5">
      {/* Banner Informativo: Contabilidad Fiscal Estricta (Solo Facturas CFDI) */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#173865] flex items-center justify-center text-white shrink-0 font-black text-sm shadow-sm">
            SAT
          </div>
          <div>
            <h4 className="font-black text-gray-900 flex items-center gap-2 flex-wrap">
              <span>Cálculo Fiscal Estricto (Solo Facturas Emitidas vs Recibidas)</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-green-100 text-green-800 border border-green-200 font-bold">
                100% CFDI
              </span>
            </h4>
            <p className="text-gray-600 text-xs mt-1 leading-relaxed">
              Este módulo contempla <strong className="text-gray-900">únicamente las facturas que generas y las que te generan tus proveedores</strong>. Tus ingresos o egresos no facturados permanecen en tu flujo de caja diario pero no se consideran aquí para proteger la exactitud de tu declaración oficial del SAT.
            </p>
          </div>
        </div>
      </div>

      {/* Barra superior de control y acciones */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Año:</span>
            <PillSelect
              value={selectedYear}
              onChange={(val) => setSelectedYear(Number(val))}
              options={[currentYear - 1, currentYear, currentYear + 1].map((y) => ({ value: y, label: String(y) }))}
              className="px-4 py-2 text-xs min-w-[90px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500">Mes:</span>
            <PillSelect
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(Number(val))}
              options={[
                { value: 1, label: 'Enero' },
                { value: 2, label: 'Febrero' },
                { value: 3, label: 'Marzo' },
                { value: 4, label: 'Abril' },
                { value: 5, label: 'Mayo' },
                { value: 6, label: 'Junio' },
                { value: 7, label: 'Julio' },
                { value: 8, label: 'Agosto' },
                { value: 9, label: 'Septiembre' },
                { value: 10, label: 'Octubre' },
                { value: 11, label: 'Noviembre' },
                { value: 12, label: 'Diciembre' }
              ]}
              className="px-4 py-2 text-xs min-w-[130px]"
            />
          </div>

          <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#173865] border border-blue-100">
            Régimen: RESICO Personas Físicas
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Factura XML (CFDI)</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#173865]" />
            <span>Registro Manual</span>
          </button>
        </div>
      </div>

      {/* GRÁFICA COMPARATIVA MENSUAL */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#173865]" />
              Comparativa Mensual: Ventas, Gastos y Ganancia Neta ({selectedYear})
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Haz clic en cualquier mes para inspeccionar y calcular su declaración RESICO detallada.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 font-bold">Ventas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600 font-bold">Gastos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#173865]" />
              <span className="text-gray-600 font-bold">Ganancia Neta</span>
            </div>
          </div>
        </div>

        <div className="pt-4 overflow-x-auto">
          <div className="min-w-[680px] h-64 flex items-end gap-3 pb-6 pt-2 border-b border-gray-100">
            {comparativa.map((m) => {
              const isSelected = m.mes === selectedMonth;
              const hVentas = Math.max(4, Math.round((m.ventas / maxMonto) * 190));
              const hGastos = Math.max(4, Math.round((m.gastos / maxMonto) * 190));
              const hGanancia = Math.max(4, Math.round((Math.max(0, m.gananciaNeta) / maxMonto) * 190));

              return (
                <div
                  key={m.mes}
                  onClick={() => setSelectedMonth(m.mes)}
                  className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer transition-all p-1.5 rounded-2xl ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  title={`${m.mesCompleto}: Ventas ${formatMoney(m.ventas)} | Gastos ${formatMoney(m.gastos)} | Ganancia ${formatMoney(m.gananciaNeta)}`}
                >
                  <div className="w-full flex items-end justify-center gap-1 h-[190px]">
                    <div
                      style={{ height: `${hVentas}px` }}
                      className="w-2.5 sm:w-3.5 bg-green-500 rounded-t-md transition-all hover:brightness-110"
                    />
                    <div
                      style={{ height: `${hGastos}px` }}
                      className="w-2.5 sm:w-3.5 bg-red-500 rounded-t-md transition-all hover:brightness-110"
                    />
                    <div
                      style={{ height: `${hGanancia}px` }}
                      className="w-2.5 sm:w-3.5 bg-[#173865] rounded-t-md transition-all hover:brightness-110"
                    />
                  </div>

                  <span className={`text-[11px] font-bold mt-2 ${
                    isSelected ? 'text-[#173865] font-black' : 'text-gray-400'
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
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Ventas del Mes</span>
            <ArrowDownLeft className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1.5">
            {formatMoney(resicoData?.kpis?.ventasFacturadas || 0)}
          </div>
          <span className="text-xs text-gray-400 block mt-1">
            {resicoData?.mesNombre} {selectedYear}
          </span>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Gastos del Mes</span>
            <ArrowUpRight className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-1.5">
            {formatMoney(resicoData?.kpis?.gastosFacturados || 0)}
          </div>
          <span className="text-xs text-gray-400 block mt-1">
            Compras & Insumos comprobados
          </span>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Ganancia Neta</span>
            <DollarSign className="w-4 h-4 text-[#173865]" />
          </div>
          <div className={`text-2xl font-black mt-1.5 ${
            (resicoData?.kpis?.gananciaNeta || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatMoney(resicoData?.kpis?.gananciaNeta || 0)}
          </div>
          <span className="text-xs text-gray-400 block mt-1">
            Margen: {resicoData?.kpis?.margenPorcentaje || 0}%
          </span>
        </div>

        <div className="bg-[#173865] text-white rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between text-blue-200 text-xs font-bold uppercase tracking-wider">
            <span>Impuestos Estimados SAT</span>
            <ShieldCheck className="w-4 h-4 text-blue-200" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">
            {formatMoney(resicoData?.kpis?.totalImpuestosEstimados || 0)}
          </div>
          <span className="text-[11px] text-blue-200 block mt-1">
            ISR (${resicoData?.isrResico?.isrNetoPagar || 0}) + IVA (${resicoData?.ivaResico?.ivaNetoPagar || 0})
          </span>
        </div>
      </div>

      {/* DESGLOSE FISCAL RESICO: ISR E IVA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#173865] flex items-center justify-center font-black text-xs">
                ISR
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Pago Provisional de ISR (RESICO)
                </h4>
                <p className="text-xs text-gray-400">
                  Ley del ISR Art. 113-E (Personas Físicas)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#173865] border border-blue-100">
              Tasa: {resicoData?.isrResico?.tasaPorcentaje || 1.0}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Ingresos Cobrados del Mes (Base Gravable):</span>
              <span className="font-bold text-gray-800">
                {formatMoney(resicoData?.isrResico?.baseGravable || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Tasa de Impuesto Aplicable:</span>
              <span className="font-bold text-[#173865]">
                {resicoData?.isrResico?.tasaPorcentaje || 1.0}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">ISR Determinado del Período:</span>
              <span className="font-bold text-gray-900">
                {formatMoney(resicoData?.isrResico?.isrDeterminado || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Menos: Retenciones de ISR por Personas Morales (1.25%):</span>
              <span className="font-bold text-green-600">
                - {formatMoney(resicoData?.isrResico?.retencionIsr || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 bg-blue-50/70 px-4 rounded-2xl border border-blue-100">
              <span className="font-bold text-[#173865] text-xs">
                = ISR Neto a Pagar al SAT:
              </span>
              <span className="font-black text-[#173865] text-base">
                {formatMoney(resicoData?.isrResico?.isrNetoPagar || 0)}
              </span>
            </div>

            {resicoData?.isrResico?.isrSaldoFavor > 0 && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-3 rounded-2xl font-medium">
                ✨ Tienes saldo a favor de ISR por retenciones de {formatMoney(resicoData?.isrResico?.isrSaldoFavor)}.
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#173865]">
              <Info className="w-3.5 h-3.5" />
              <span>Criterio Contable RESICO ISR:</span>
            </div>
            <p className="leading-relaxed">
              En RESICO Personas Físicas, <strong className="text-gray-800">los gastos NO disminuyen la base del ISR</strong>. La ley ya te beneficia con una tasa preferencial (1.0% a 2.5%) sobre tus cobros brutos.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#173865] flex items-center justify-center font-black text-xs">
                IVA
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Pago Definitivo de IVA Mensual
                </h4>
                <p className="text-xs text-gray-400">
                  Ley del IVA (Acreditamiento de Gastos 16%)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#173865] border border-blue-100">
              Tasa General: 16%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">IVA Trasladado (16% Cobrado a Clientes):</span>
              <span className="font-bold text-red-600">
                + {formatMoney(resicoData?.ivaResico?.ivaTrasladado || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Menos: IVA Acreditable (Compras e Insumos con CFDI):</span>
              <span className="font-bold text-green-600">
                - {formatMoney(resicoData?.ivaResico?.ivaAcreditable || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Menos: Retenciones de IVA aplicadas por Clientes:</span>
              <span className="font-bold text-[#173865]">
                - {formatMoney(resicoData?.ivaResico?.retencionIva || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 bg-blue-50/70 px-4 rounded-2xl border border-blue-100">
              <span className="font-bold text-gray-800 text-xs">
                = IVA Neto a Pagar al SAT:
              </span>
              <span className={`font-black text-base ${
                (resicoData?.ivaResico?.ivaNetoPagar || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatMoney(resicoData?.ivaResico?.ivaNetoPagar || 0)}
              </span>
            </div>

            {(resicoData?.ivaResico?.ivaSaldoFavor || 0) > 0 && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 p-3 rounded-2xl font-medium">
                🎉 Tienes <strong className="text-green-900">{formatMoney(resicoData?.ivaResico?.ivaSaldoFavor)}</strong> de Saldo a Favor de IVA acumulado para acreditar el próximo mes.
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#173865]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Criterio Contable de Acreditamiento de IVA:</span>
            </div>
            <p className="leading-relaxed">
              Para el IVA, <strong className="text-gray-800">todas tus facturas de insumos y servicios son indispensables</strong>. Cada peso de IVA pagado se resta 1:1 contra el IVA cobrado.
            </p>
          </div>
        </div>
      </div>

      {/* GUÍA DEL CONTADOR */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#173865]" />
            Criterios y Tips del Contador Experto en RESICO
          </h4>
          <span className="text-[11px] text-gray-400 font-mono font-bold">SAT MÉXICO</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
              <Utensils className="w-4 h-4" />
              <span>Alimentos / Restaurante</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-800">Máximo 8.5% acreditable</strong> si es dentro de 50 km (LISR Art. 28 Fracc. XX). Obligatorio pagar con tarjeta o transferencia.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
              <Fuel className="w-4 h-4" />
              <span>Gasolina & Combustible</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-red-700">¡Cero efectivo!</strong> Debe pagarse siempre con tarjeta o monedero electrónico para acreditar el 100% del IVA.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-green-700 font-bold text-xs">
              <Boxes className="w-4 h-4" />
              <span>Insumos y Materiales</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-green-800">100% Acreditable</strong>. Vinil, lona, DTF, playeras, tazas y tintas son materia prima indispensable.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-[#173865] font-bold text-xs">
              <Building2 className="w-4 h-4" />
              <span>Facturación a Empresas</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Si le vendes a una <strong className="text-gray-800">Persona Moral</strong>, te retendrán el <strong className="text-[#173865]">1.25% de ISR</strong> que restas 100% en tu declaración.
            </p>
          </div>
        </div>
      </div>

      {/* LISTADO DE FACTURAS */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#173865]" />
            <h4 className="text-sm font-bold text-gray-900">
              Facturas del Período ({resicoData?.mesNombre} {selectedYear})
            </h4>
            <span className="min-w-[20px] h-5 px-2 rounded-full text-xs font-bold bg-blue-50 text-[#173865] border border-blue-100 flex items-center justify-center">
              {filteredFacturas.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-full border border-gray-100">
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#173865] text-white shadow'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Folio / UUID</th>
                <th className="py-3 px-3">Emisor / Receptor</th>
                <th className="py-3 px-3 text-center">Categoría</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">IVA</th>
                <th className="py-3 px-3 text-right">Ret. ISR</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFacturas.length > 0 ? (
                filteredFacturas.map(f => {
                  const isEmitida = f.tipo === 'EMITIDA';
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isEmitida
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {isEmitida ? 'EMITIDA' : 'RECIBIDA'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 font-medium">
                        {f.fecha}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-800">{f.folio || 'S/F'}</div>
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[130px]" title={f.uuid}>
                          {f.uuid || f.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-800">
                          {isEmitida ? (f.nombreReceptor || f.rfcReceptor || 'Cliente') : (f.nombreEmisor || f.rfcEmisor || 'Proveedor')}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {isEmitida ? f.rfcReceptor : f.rfcEmisor}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-full text-[11px] text-gray-700 font-semibold">
                          {f.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-700">
                        {formatMoney(f.subtotal)}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600">
                        {formatMoney(f.ivaTrasladado)}
                      </td>
                      <td className="py-3 px-3 text-right text-[#173865] font-bold">
                        {f.isrRetenido > 0 ? `-${formatMoney(f.isrRetenido)}` : '$0.00'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900">
                        {formatMoney(f.total)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleDeleteFactura(f.id)}
                          className="w-7 h-7 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
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
                  <td colSpan={10} className="py-10 text-center text-gray-400 font-bold text-xs">
                    No hay facturas registradas en este período. Puedes subir tus archivos XML o agregarlas manualmente arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SUBIR ARCHIVOS XML */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer" onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}>
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative my-6 animate-modal-in cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-gray-900">
                  Subir Factura XML (CFDI 4.0 / 3.3)
                </h3>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Selecciona si la factura es una <strong className="text-gray-800">venta emitida por ti</strong> o un <strong className="text-gray-800">gasto de proveedor</strong>. Al subir el XML se guarda y analiza automáticamente.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block pl-1">
                  Tipo de Comprobante:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-full border border-gray-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setXmlUploadTipo('AUTO')}
                    className={`py-2 px-2 rounded-full font-bold text-xs transition-all ${
                      xmlUploadTipo === 'AUTO'
                        ? 'bg-[#173865] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Auto por RFC
                  </button>
                  <button
                    type="button"
                    onClick={() => setXmlUploadTipo('EMITIDA')}
                    className={`py-2 px-2 rounded-full font-bold text-xs transition-all ${
                      xmlUploadTipo === 'EMITIDA'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Emitida (Venta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setXmlUploadTipo('RECIBIDA')}
                    className={`py-2 px-2 rounded-full font-bold text-xs transition-all ${
                      xmlUploadTipo === 'RECIBIDA'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Recibida (Gasto)
                  </button>
                </div>
              </div>

              <label className="border-2 border-dashed border-gray-200 hover:border-[#173865] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50/40 transition-all text-center">
                <Upload className="w-8 h-8 text-[#173865] mb-2" />
                <span className="text-xs font-bold text-gray-800">
                  Seleccionar o arrastrar archivo XML
                </span>
                <span className="text-[11px] text-gray-400 mt-1">
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
                <div className="text-center py-2 text-xs text-[#173865] font-bold animate-pulse">
                  Extrayendo datos fiscales y guardando en tu declaración...
                </div>
              )}

              {uploadStatus && uploadStatus.success > 0 && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200 text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>✓ ¡Factura guardada y analizada correctamente!</span>
                  </div>

                  {uploadStatus.lastFactura && (
                    <div className="bg-white p-3 rounded-xl border border-green-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          uploadStatus.lastFactura.tipo === 'EMITIDA'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {uploadStatus.lastFactura.tipo === 'EMITIDA' ? 'FACTURA EMITIDA' : 'FACTURA RECIBIDA'}
                        </span>
                        <span className="text-gray-400 font-mono">{uploadStatus.lastFactura.fecha}</span>
                      </div>

                      <div className="text-gray-800 font-bold truncate pt-1">
                        {uploadStatus.lastFactura.tipo === 'EMITIDA' 
                          ? `Cliente: ${uploadStatus.lastFactura.nombreReceptor || uploadStatus.lastFactura.rfcReceptor}` 
                          : `Proveedor: ${uploadStatus.lastFactura.nombreEmisor || uploadStatus.lastFactura.rfcEmisor}`}
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100 text-center">
                        <div>
                          <span className="text-[10px] text-gray-400 block">Subtotal</span>
                          <span className="font-bold text-gray-800">{formatMoney(uploadStatus.lastFactura.subtotal)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">IVA</span>
                          <span className="font-bold text-gray-800">{formatMoney(uploadStatus.lastFactura.ivaTrasladado)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">Total</span>
                          <span className="font-black text-[#173865]">{formatMoney(uploadStatus.lastFactura.total)}</span>
                        </div>
                      </div>
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
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow transition-all flex items-center justify-center gap-1.5 text-xs active:scale-95"
                  >
                    <span>Ver Análisis del Período ({uploadStatus.month}/{uploadStatus.year || selectedYear})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadStatus && uploadStatus.errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Errores al procesar archivo(s):</span>
                  </div>
                  {uploadStatus.errors.map((e, idx) => (
                    <div key={idx} className="text-xs">• {e}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-full transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO MANUAL DE FACTURA */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer" onClick={() => setShowManualModal(false)}>
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative my-6 animate-modal-in cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 text-[#173865] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-gray-900">
                  Registrar Factura Manual
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Tipo de Factura</label>
                  <PillSelect
                    value={manualForm.tipo}
                    onChange={(val) => setManualForm({ ...manualForm, tipo: val })}
                    options={[
                      { value: 'RECIBIDA', label: 'Recibida (Gasto)' },
                      { value: 'EMITIDA', label: 'Emitida (Venta)' }
                    ]}
                    className="w-full px-4 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Fecha de Emisión</label>
                  <PillDatePicker
                    required
                    value={manualForm.fecha}
                    onChange={(val) => setManualForm({ ...manualForm, fecha: val })}
                    className="bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold shadow-sm text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Folio o Referencia</label>
                  <input
                    type="text"
                    value={manualForm.folio}
                    onChange={(e) => setManualForm({ ...manualForm, folio: e.target.value })}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Categoría</label>
                  <PillSelect
                    value={manualForm.categoria}
                    onChange={(val) => setManualForm({ ...manualForm, categoria: val })}
                    options={['Insumos', 'Gasolina', 'Alimentos', 'Servicios', 'Otros']}
                    className="w-full px-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">RFC Emisor / Proveedor</label>
                  <input
                    type="text"
                    value={manualForm.rfcEmisor}
                    onChange={(e) => setManualForm({ ...manualForm, rfcEmisor: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 uppercase font-mono font-bold shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Nombre / Razón Social</label>
                  <input
                    type="text"
                    value={manualForm.nombreEmisor}
                    onChange={(e) => setManualForm({ ...manualForm, nombreEmisor: e.target.value })}
                    className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Subtotal ($)</label>
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
                    className="w-full bg-white text-gray-800 px-3 py-2 rounded-full border border-gray-200 font-bold text-center shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">IVA 16% ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.ivaTrasladado}
                    onChange={(e) => setManualForm({ ...manualForm, ivaTrasladado: e.target.value })}
                    className="w-full bg-white text-gray-800 px-3 py-2 rounded-full border border-gray-200 font-bold text-center shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-bold block mb-1 pl-2">Ret. ISR 1.25%</label>
                  <input
                    type="number"
                    step="any"
                    value={manualForm.isrRetenido}
                    onChange={(e) => setManualForm({ ...manualForm, isrRetenido: e.target.value })}
                    className="w-full bg-white text-gray-800 px-3 py-2 rounded-full border border-gray-200 font-bold text-center shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1 pl-2">Descripción / Concepto</label>
                <input
                  type="text"
                  value={manualForm.descripcion}
                  onChange={(e) => setManualForm({ ...manualForm, descripcion: e.target.value })}
                  className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-medium shadow-sm focus:ring-2 focus:ring-[#173865] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-full transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#173865] hover:bg-blue-900 text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95"
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
