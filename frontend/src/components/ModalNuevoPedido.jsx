import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  ChevronDown
} from 'lucide-react';

const METODOS_PAGO = [
  'STOCK',
  'NU MINA',
  'NU EMI',
  'MERCADO PAGO',
  'EFECTIVO',
  'NU TDC',
  'PLATA TDC'
];

export default function ModalNuevoPedido({ 
  tipo = 'PEDIDO', 
  pedidos = [], 
  clientes = [], 
  inventario = [], 
  catalogo = [],
  initialData = null, 
  onClose, 
  onSave 
}) {
  const isEditing = Boolean(initialData && initialData.id);

  // Helper to load draft if not editing an existing persisted order
  const getInitialDraft = () => {
    if (initialData && initialData.id) return null;
    try {
      const raw = localStorage.getItem('mina_draft_order');
      if (raw) {
        const d = JSON.parse(raw);
        if (d && (d.clienteNombre || (d.productos && d.productos.length > 0 && d.productos[0]?.nombre))) {
          return d;
        }
      }
    } catch (e) {
      console.warn('Error reading draft:', e);
    }
    return null;
  };

  const savedDraft = (!initialData || !initialData.id) ? getInitialDraft() : null;
  const [isDraftRestored, setIsDraftRestored] = useState(Boolean(savedDraft && !initialData));

  const [pedidoTipo, setPedidoTipo] = useState(initialData?.tipo || savedDraft?.tipo || tipo);
  const [folio, setFolio] = useState(initialData?.id || '');
  const [clienteNombre, setClienteNombre] = useState(initialData?.cliente || savedDraft?.clienteNombre || '');
  const [telefono, setTelefono] = useState(initialData?.telefono || savedDraft?.telefono || '');
  const [correo, setCorreo] = useState(initialData?.correo || savedDraft?.correo || '');
  const todayIsoDate = new Date().toISOString().split('T')[0];
  const [fechaEntrega, setFechaEntrega] = useState(
    initialData?.fechaEntrega || initialData?.fecha?.split('T')[0] || savedDraft?.fechaEntrega || todayIsoDate
  );
  const [requiereFactura, setRequiereFactura] = useState(initialData?.requiereFactura ?? savedDraft?.requiereFactura ?? false);
  const [tipoPersona, setTipoPersona] = useState(initialData?.tipoPersona || savedDraft?.tipoPersona || 'Fisica');
  const [rfc, setRfc] = useState(initialData?.rfc || savedDraft?.rfc || '');
  const [razonSocial, setRazonSocial] = useState(initialData?.razonSocial || savedDraft?.razonSocial || '');
  const [cp, setCp] = useState(initialData?.cp || savedDraft?.cp || '');
  const [regimenFiscal, setRegimenFiscal] = useState(initialData?.regimenFiscal || savedDraft?.regimenFiscal || '612 Personas Físicas con Actividades Empresariales');
  const [usoCfdi, setUsoCfdi] = useState(initialData?.usoCfdi || savedDraft?.usoCfdi || 'G03 Gastos en general');
  const [pagado, setPagado] = useState(initialData?.pagado ?? savedDraft?.pagado ?? 0);
  const [metodoPagoAnticipo, setMetodoPagoAnticipo] = useState(initialData?.metodoPagoAnticipo || savedDraft?.metodoPagoAnticipo || 'NU MINA');
  const [collapsedInsumos, setCollapsedInsumos] = useState({});
  const [collapsedMermas, setCollapsedMermas] = useState({});

  // UI states for custom floating pill dropdowns (replaces native datalist)
  const [openClientDrop, setOpenClientDrop] = useState(false);
  const [openCatalogoDrop, setOpenCatalogoDrop] = useState(null);
  const [openInsumoDrop, setOpenInsumoDrop] = useState(null);
  const [openMermaDrop, setOpenMermaDrop] = useState(null);

  const closeAllDrops = () => {
    setOpenClientDrop(false);
    setOpenCatalogoDrop(null);
    setOpenInsumoDrop(null);
    setOpenMermaDrop(null);
  };

  // Products array
  const [productos, setProductos] = useState(() => {
    const sourceProds = (initialData?.productos && initialData.productos.length > 0)
      ? initialData.productos
      : (savedDraft?.productos && savedDraft.productos.length > 0 ? savedDraft.productos : null);

    if (sourceProds && sourceProds.length > 0) {
      return sourceProds.map(p => ({
        nombre: p.nombre || '',
        proveedor: p.proveedor || '',
        nota: p.nota || '',
        cant: p.cant || 1,
        precioUnitario: p.precioUnitario || 0,
        costoUnitario: p.costoUnitario || 0,
        insumos: (p.insumos || []).map(i => {
          const c = i.cant || 1;
          const cu = i.costoUnitario || (i.costo ? i.costo / c : 0);
          return {
            nombre: i.nombre || '',
            detalle: i.detalle || '',
            medida: i.medida || '',
            nota: i.nota || '',
            proveedor: i.proveedor || '',
            metodoPago: i.metodoPago || 'STOCK',
            cant: c,
            costoUnitario: cu,
            costo: i.costo || (c * cu)
          };
        }),
        mermas: (p.mermas || []).map(m => ({
          material: m.material || '',
          cant: m.cant || 1,
          motivo: m.motivo || '',
          costoUnitario: m.costoUnitario || 0,
          metodoPago: m.metodoPago || 'STOCK'
        }))
      }));
    }
    return [
      {
        nombre: '',
        proveedor: '',
        nota: '',
        cant: 1,
        precioUnitario: 0,
        costoUnitario: 0,
        insumos: [],
        mermas: []
      }
    ];
  });

  const [loading, setLoading] = useState(false);

  // Folios correlativos cronológicos desde 001
  useEffect(() => {
    if (isEditing) return;

    const prefix = pedidoTipo === 'COTIZACION' ? 'CMD-' : 'PMD-';
    const sameTypeOrders = pedidos.filter(p => (p.tipo || '').toUpperCase() === pedidoTipo.toUpperCase() || p.id.startsWith(prefix));
    
    const existingNums = sameTypeOrders
      .map(p => {
        const match = p.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => n > 0 && n < 700);

    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : (sameTypeOrders.length + 1);
    const formattedNum = String(nextNum).padStart(3, '0');
    setFolio(`${prefix}${formattedNum}`);
  }, [pedidoTipo, pedidos, isEditing]);

  // Auto-guardado en borrador (estilo Gmail)
  useEffect(() => {
    if (isEditing) return;

    const hasContent = 
      (clienteNombre && clienteNombre.trim() !== '') ||
      (telefono && telefono.trim() !== '') ||
      (correo && correo.trim() !== '') ||
      productos.length > 1 ||
      (productos[0] && ((productos[0].nombre && productos[0].nombre.trim() !== '') || (productos[0].insumos && productos[0].insumos.length > 0) || productos[0].precioUnitario > 0));

    if (hasContent) {
      const draftData = {
        tipo: pedidoTipo,
        clienteNombre,
        telefono,
        correo,
        fechaEntrega,
        requiereFactura,
        tipoPersona,
        rfc,
        razonSocial,
        cp,
        regimenFiscal,
        usoCfdi,
        pagado,
        metodoPagoAnticipo,
        productos,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('mina_draft_order', JSON.stringify(draftData));
      window.dispatchEvent(new Event('mina_draft_updated'));
    }
  }, [
    isEditing,
    pedidoTipo,
    clienteNombre,
    telefono,
    correo,
    fechaEntrega,
    requiereFactura,
    tipoPersona,
    rfc,
    razonSocial,
    cp,
    regimenFiscal,
    usoCfdi,
    pagado,
    metodoPagoAnticipo,
    productos
  ]);

  const handleDiscardDraft = () => {
    if (window.confirm('¿Deseas descartar este borrador y empezar en blanco? Los cambios no guardados se perderán.')) {
      localStorage.removeItem('mina_draft_order');
      window.dispatchEvent(new Event('mina_draft_updated'));
      setIsDraftRestored(false);
      setClienteNombre('');
      setTelefono('');
      setCorreo('');
      setFechaEntrega(todayIsoDate);
      setRequiereFactura(false);
      setTipoPersona('Fisica');
      setRfc('');
      setRazonSocial('');
      setCp('');
      setRegimenFiscal('612 Personas Físicas con Actividades Empresariales');
      setUsoCfdi('G03 Gastos en general');
      setPagado(0);
      setMetodoPagoAnticipo('NU MINA');
      setProductos([
        {
          nombre: '',
          proveedor: '',
          nota: '',
          cant: 1,
          precioUnitario: 0,
          costoUnitario: 0,
          insumos: [],
          mermas: []
        }
      ]);
    }
  };

  // Client autocomplete
  const handleSelectCliente = (nom) => {
    setClienteNombre(nom);
    const found = clientes.find(c => c.nombre.toLowerCase() === nom.toLowerCase());
    if (found) {
      if (found.telefono) setTelefono(found.telefono);
      if (found.correo) setCorreo(found.correo);
      if (found.rfc) setRfc(found.rfc);
      if (found.cp) setCp(found.cp);
      if (found.regimen) setRegimenFiscal(found.regimen);
      if (found.usoCfdi) setUsoCfdi(found.usoCfdi);
    }
  };

  // Product management
  const addProducto = () => {
    setProductos([
      ...productos,
      {
        nombre: '',
        proveedor: '',
        nota: '',
        cant: 1,
        precioUnitario: 0,
        costoUnitario: 0,
        insumos: [],
        mermas: []
      }
    ]);
  };

  const removeProducto = (pIndex) => {
    if (productos.length === 1) return;
    setProductos(productos.filter((_, idx) => idx !== pIndex));
  };

  const updateProducto = (pIndex, field, value) => {
    const updated = [...productos];
    updated[pIndex][field] = value;

    if (field === 'nombre' && value) {
      const matchCat = catalogo.find(c => c.nombre.toLowerCase() === value.trim().toLowerCase());
      if (matchCat) {
        if (matchCat.precio && (!updated[pIndex].precioUnitario || updated[pIndex].precioUnitario === 0)) {
          updated[pIndex].precioUnitario = matchCat.precio;
        }
        if (matchCat.proveedor && !updated[pIndex].proveedor) {
          updated[pIndex].proveedor = matchCat.proveedor;
        }
        if (matchCat.insumos && matchCat.insumos.length > 0 && (!updated[pIndex].insumos || updated[pIndex].insumos.length === 0)) {
          updated[pIndex].insumos = matchCat.insumos.map(i => ({
            nombre: i.nombre || '',
            detalle: i.detalle || '',
            medida: i.medida || '',
            nota: i.nota || '',
            proveedor: i.proveedor || '',
            metodoPago: i.metodoPago || 'STOCK',
            cant: parseFloat(i.cant) || 1,
            costoUnitario: parseFloat(i.costoUnitario) || 0,
            costo: parseFloat(i.costo) || ((parseFloat(i.cant) || 1) * (parseFloat(i.costoUnitario) || 0))
          }));
        }
      }
    }

    setProductos(updated);
  };

  // Insumos management
  const addInsumo = (pIndex) => {
    const updated = [...productos];
    updated[pIndex].insumos.push({
      nombre: '',
      detalle: '',
      medida: '',
      nota: '',
      proveedor: '',
      metodoPago: 'STOCK',
      cant: 1,
      costoUnitario: 0,
      costo: 0
    });
    setProductos(updated);
  };

  const removeInsumo = (pIndex, iIndex) => {
    const updated = [...productos];
    updated[pIndex].insumos.splice(iIndex, 1);
    setProductos(updated);
  };

  const updateInsumo = (pIndex, iIndex, field, value) => {
    const updated = [...productos];
    const ins = updated[pIndex].insumos[iIndex];
    ins[field] = value;

    if (field === 'nombre') {
      const match = inventario.find(inv => inv.nombre.toLowerCase().trim() === (value || '').toLowerCase().trim());
      if (match) {
        ins.costoUnitario = parseFloat(match.precio) || 0;
        if (match.proveedor) ins.proveedor = match.proveedor;
        if (match.medida && !ins.detalle) ins.detalle = match.medida;
        if (match.medida && !ins.medida) ins.medida = match.medida;
        ins.metodoPago = 'STOCK';
      }
    }

    const c = parseFloat(ins.cant) || 1;
    const cu = parseFloat(ins.costoUnitario) || 0;
    ins.costo = c * cu;

    setProductos(updated);
  };

  const handleSelectInsumoStock = (pIndex, iIndex, stockItemName) => {
    const updated = [...productos];
    const ins = updated[pIndex].insumos[iIndex];
    if (stockItemName === '__CUSTOM__') {
      ins.nombre = '';
      ins.metodoPago = 'STOCK';
    } else {
      const match = inventario.find(inv => inv.nombre === stockItemName);
      if (match) {
        ins.nombre = match.nombre;
        ins.costoUnitario = parseFloat(match.precio) || 0;
        if (match.proveedor) ins.proveedor = match.proveedor;
        if (match.medida) ins.detalle = match.medida;
        if (match.medida) ins.medida = match.medida;
        ins.metodoPago = 'STOCK';
      } else {
        ins.nombre = stockItemName;
      }
    }
    const c = parseFloat(ins.cant) || 1;
    const cu = parseFloat(ins.costoUnitario) || 0;
    ins.costo = c * cu;
    setProductos(updated);
  };

  // Mermas management
  const addMerma = (pIndex) => {
    const updated = [...productos];
    updated[pIndex].mermas.push({
      material: '',
      cant: 1,
      motivo: '',
      costoUnitario: 0,
      metodoPago: 'STOCK'
    });
    setProductos(updated);
  };

  const removeMerma = (pIndex, mIndex) => {
    const updated = [...productos];
    updated[pIndex].mermas.splice(mIndex, 1);
    setProductos(updated);
  };

  const updateMerma = (pIndex, mIndex, field, value) => {
    const updated = [...productos];
    updated[pIndex].mermas[mIndex][field] = value;
    setProductos(updated);
  };

  // Financial calculations
  let subtotal = 0;
  let costoInsumosTotal = 0;
  let costoMermasTotal = 0;

  productos.forEach((p) => {
    const cant = parseFloat(p.cant) || 0;
    const pu = parseFloat(p.precioUnitario) || 0;
    subtotal += cant * pu;

    (p.insumos || []).forEach((ins) => {
      costoInsumosTotal += (parseFloat(ins.costo) || 0);
    });

    (p.mermas || []).forEach((m) => {
      const mc = parseFloat(m.cant) || 0;
      const mcu = parseFloat(m.costoUnitario) || 0;
      costoMermasTotal += mc * mcu;
    });
  });

  const costoTotal = costoInsumosTotal + costoMermasTotal;
  
  const iva = requiereFactura ? subtotal * 0.16 : 0;
  const retencionIsr = (requiereFactura && tipoPersona === 'Moral') ? subtotal * 0.0125 : 0;
  const total = subtotal + iva - retencionIsr;
  const ganancia = total - costoTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      alert('Por favor especifica el nombre del cliente');
      return;
    }
    if (productos.length === 0 || !productos[0].nombre.trim()) {
      alert('Por favor agrega al menos un producto con descripción');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: folio,
        tipo: pedidoTipo,
        fecha: fechaEntrega ? `${fechaEntrega}T12:00:00` : (initialData?.fecha || new Date().toISOString()),
        cliente: clienteNombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        requiereFactura,
        tipoPersona,
        rfc: requiereFactura ? rfc : null,
        razonSocial: requiereFactura ? (razonSocial || clienteNombre) : null,
        cp: requiereFactura ? cp : null,
        regimenFiscal: requiereFactura ? regimenFiscal : null,
        usoCfdi: requiereFactura ? usoCfdi : null,
        fechaEntrega: fechaEntrega || todayIsoDate,
        subtotal,
        iva,
        retencionIsr,
        total,
        pagado: parseFloat(pagado) || 0,
        metodoPagoAnticipo: metodoPagoAnticipo || 'NU MINA',
        costoTotal,
        costoMermasTotal,
        ganancia,
        estatus: initialData?.estatus || 'Pendiente',
        facturaEstatus: initialData?.facturaEstatus || (requiereFactura ? 'Pendiente' : '-'),
        facturaFecha: initialData?.facturaFecha || null,
        facturaArchivoData: initialData?.facturaArchivoData || null,
        facturaArchivoNombre: initialData?.facturaArchivoNombre || null,
        productos: productos.map((p) => {
          const cIns = (p.insumos || []).reduce((acc, i) => acc + (parseFloat(i.costo) || 0), 0);
          const cMer = (p.mermas || []).reduce((acc, m) => acc + ((parseFloat(m.cant) || 1) * (parseFloat(m.costoUnitario) || 0)), 0);
          const cProdTotal = cIns + cMer;
          const cantP = parseFloat(p.cant) || 1;

          return {
            nombre: p.nombre,
            proveedor: p.proveedor,
            nota: p.nota || '',
            cant: cantP,
            precioUnitario: parseFloat(p.precioUnitario) || 0,
            costoUnitario: cProdTotal / cantP,
            insumos: p.insumos.map((i) => ({
              nombre: i.nombre,
              detalle: i.detalle || '',
              medida: i.medida || '',
              nota: i.nota || '',
              proveedor: i.proveedor || '',
              metodoPago: i.metodoPago || 'STOCK',
              cant: parseFloat(i.cant) || 1,
              costoUnitario: parseFloat(i.costoUnitario) || 0,
              costo: parseFloat(i.costo) || 0
            })),
            mermas: p.mermas.map((m) => ({
              material: m.material,
              cant: parseFloat(m.cant) || 1,
              motivo: m.motivo || '',
              costoUnitario: parseFloat(m.costoUnitario) || 0,
              metodoPago: m.metodoPago || 'STOCK'
            }))
          };
        })
      };

      await onSave(payload);
      localStorage.removeItem('mina_draft_order');
      window.dispatchEvent(new Event('mina_draft_updated'));
      onClose();
    } catch (err) {
      alert(err.message || 'Error al guardar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto animate-backdrop-in cursor-pointer" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 w-full max-w-7xl w-[96vw] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-modal-in cursor-default" onClick={(e) => { e.stopPropagation(); closeAllDrops(); }}>
        
        {/* Header Superior Fijo */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-black text-gray-900 text-base sm:text-lg">
              {isEditing ? 'Editar' : 'Crear'} {pedidoTipo === 'COTIZACION' ? 'Cotización' : 'Pedido'}
            </span>

            {!isEditing && (
              <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPedidoTipo('PEDIDO')}
                  className={`px-4 py-1.5 rounded-full font-bold transition-all ${
                    pedidoTipo === 'PEDIDO' ? 'bg-[#173865] text-white shadow' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Pedido
                </button>
                <button
                  type="button"
                  onClick={() => setPedidoTipo('COTIZACION')}
                  className={`px-4 py-1.5 rounded-full font-bold transition-all ${
                    pedidoTipo === 'COTIZACION' ? 'bg-[#173865] text-white shadow' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Cotización
                </button>
              </div>
            )}

            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-[#173865] border border-blue-200">
              {folio}
            </span>
          </div>

          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner de Borrador */}
        {!isEditing && (
          <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-2 flex items-center justify-between text-xs text-[#173865]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#173865] animate-pulse"></span>
              <span className="font-medium">
                {isDraftRestored 
                  ? 'Borrador recuperado automáticamente. Tu progreso no consume folio hasta guardarse.'
                  : 'Modo borrador activo: si sales de esta ventana, tu avance se guarda sin ocupar folio.'
                }
              </span>
            </div>
            {isDraftRestored && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-[#173865] hover:text-red-600 underline font-bold transition-colors ml-2 flex-shrink-0"
              >
                Descartar borrador
              </button>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs flex-1 bg-[#f4f7fc]/50">
          
          {/* 1. Datos del Cliente */}
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
              1. Datos del Cliente
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="text-gray-500 font-bold block mb-1 pl-2">Nombre / Empresa *</label>
                <input
                  type="text"
                  required
                  value={clienteNombre}
                  onFocus={(e) => { e.stopPropagation(); setOpenClientDrop(true); }}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { handleSelectCliente(e.target.value); setOpenClientDrop(true); }}
                  className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none transition"
                />
                {openClientDrop && clientes.filter(c => !clienteNombre || c.nombre.toLowerCase().includes(clienteNombre.toLowerCase())).length > 0 && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-52 overflow-y-auto animate-modal-in"
                  >
                    {clientes
                      .filter(c => !clienteNombre || c.nombre.toLowerCase().includes(clienteNombre.toLowerCase()))
                      .map((c, i) => (
                        <div
                          key={i}
                          onClick={() => { handleSelectCliente(c.nombre); setOpenClientDrop(false); }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 flex justify-between items-center transition-colors"
                        >
                          <span>{c.nombre}</span>
                          {c.telefono && <span className="text-[11px] text-gray-400 font-normal">{c.telefono}</span>}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1 pl-2">WhatsApp / Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-gray-500 font-bold block mb-1 pl-2">Fecha de Solicitud (Clic para cambiar)</label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="w-full bg-gray-50 text-gray-800 px-4 py-2.5 rounded-full border border-gray-200 font-bold focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none cursor-pointer transition"
                />
              </div>
            </div>

            {/* Facturación Electrónica */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={requiereFactura}
                    onChange={(e) => setRequiereFactura(e.target.checked)}
                    className="rounded border-gray-300 text-[#173865] focus:ring-[#173865] w-4 h-4"
                  />
                  <span className="font-bold text-xs sm:text-sm">¿Requiere Factura Electrónica (CFDI)?</span>
                </label>

                {requiereFactura && (
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-full border border-gray-200 text-xs">
                    <label className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer transition-all ${
                      tipoPersona === 'Fisica' ? 'bg-[#173865] text-white font-bold shadow' : 'text-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="Fisica"
                        checked={tipoPersona === 'Fisica'}
                        onChange={(e) => setTipoPersona(e.target.value)}
                        className="hidden"
                      />
                      <span>Persona Física (+16% IVA)</span>
                    </label>

                    <label className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer transition-all ${
                      tipoPersona === 'Moral' ? 'bg-[#173865] text-white font-bold shadow' : 'text-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="Moral"
                        checked={tipoPersona === 'Moral'}
                        onChange={(e) => setTipoPersona(e.target.value)}
                        className="hidden"
                      />
                      <span>Persona Moral (+IVA -1.25% ISR)</span>
                    </label>
                  </div>
                )}
              </div>

              {requiereFactura && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div>
                    <label className="text-gray-500 font-bold block mb-1 pl-2">RFC</label>
                    <input
                      type="text"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 uppercase font-mono font-bold focus:ring-2 focus:ring-[#173865] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 font-bold block mb-1 pl-2">Razón Social</label>
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-bold focus:ring-2 focus:ring-[#173865] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 font-bold block mb-1 pl-2">Código Postal (CP)</label>
                    <input
                      type="text"
                      value={cp}
                      onChange={(e) => setCp(e.target.value)}
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-full border border-gray-200 font-mono font-bold focus:ring-2 focus:ring-[#173865] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Productos y Servicios */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                2. Productos y Servicios ({productos.length})
              </span>
              <button
                type="button"
                onClick={addProducto}
                className="flex items-center gap-1.5 text-xs text-[#173865] hover:bg-blue-100 font-bold px-4 py-2 rounded-full bg-blue-50 border border-blue-200 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {productos.map((prod, pIdx) => {
              const cantP = parseFloat(prod.cant) || 1;
              const puP = parseFloat(prod.precioUnitario) || 0;
              const precioTotalProd = cantP * puP;
              const filteredCat = catalogo.filter(cat =>
                !prod.nombre || cat.nombre.toLowerCase().includes(prod.nombre.toLowerCase())
              );

              return (
                <div key={pIdx} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                  
                  {/* Cabecera del Producto */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="font-black text-gray-800 text-sm">Producto #{pIdx + 1}</span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Producto:</span>
                        <span className="font-black text-green-600 text-sm">
                          ${precioTotalProd.toFixed(2)}
                        </span>
                      </div>
                      {productos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProducto(pIdx)}
                          className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hilera de Producto */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4 relative">
                      <div className="flex items-center justify-between mb-1 px-2">
                        <label className="text-gray-500 font-bold block">Descripción / Producto *</label>
                        {prod.nombre && catalogo.find(c => c.nombre.toLowerCase() === prod.nombre.trim().toLowerCase()) && (
                          <span className="text-[10px] text-[#173865] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            En Catálogo
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={prod.nombre}
                        onFocus={(e) => { e.stopPropagation(); setOpenCatalogoDrop(pIdx); }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { updateProducto(pIdx, 'nombre', e.target.value); setOpenCatalogoDrop(pIdx); }}
                        className="w-full bg-gray-50 text-gray-800 px-4 py-2 rounded-full border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#173865] font-bold transition"
                      />
                      {openCatalogoDrop === pIdx && filteredCat.length > 0 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-52 overflow-y-auto animate-modal-in"
                        >
                          {filteredCat.map((cat, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => { updateProducto(pIdx, 'nombre', cat.nombre); setOpenCatalogoDrop(null); }}
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 flex justify-between items-center transition-colors"
                            >
                              <span className="truncate">{cat.nombre}</span>
                              <span className="text-xs text-[#173865] font-black ml-2 whitespace-nowrap">${cat.precio}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-500 font-bold block mb-1 text-center">Proveedor</label>
                      <input
                        type="text"
                        value={prod.proveedor}
                        onChange={(e) => updateProducto(pIdx, 'proveedor', e.target.value)}
                        className="w-full bg-gray-50 text-gray-800 px-3 py-2 rounded-full border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none text-center font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-500 font-bold block mb-1 text-center">Nota / Detalle</label>
                      <input
                        type="text"
                        value={prod.nota}
                        onChange={(e) => updateProducto(pIdx, 'nota', e.target.value)}
                        className="w-full bg-gray-50 text-gray-800 px-3 py-2 rounded-full border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none text-center font-medium"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-gray-500 font-bold block mb-1 text-center">Cant</label>
                      <input
                        type="number"
                        min="1"
                        value={prod.cant}
                        onChange={(e) => updateProducto(pIdx, 'cant', e.target.value)}
                        className="w-full bg-gray-50 text-gray-800 px-2 py-2 rounded-full border border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-gray-500 font-bold block mb-1 text-center">P. Unit ($)</label>
                      <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-2.5 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#173865]">
                        <span className="text-gray-400 font-bold text-xs mr-1 select-none">$</span>
                        <input
                          type="number"
                          step="any"
                          value={prod.precioUnitario}
                          onChange={(e) => updateProducto(pIdx, 'precioUnitario', e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-[#173865] outline-none text-center"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-green-700 font-bold block mb-1 text-center">Precio Total ($)</label>
                      <input
                        type="text"
                        readOnly
                        value={`$${precioTotalProd.toFixed(2)}`}
                        className="w-full bg-green-50 text-green-700 font-black px-3 py-2 rounded-full border border-green-200 text-center text-sm focus:outline-none cursor-default"
                      />
                    </div>
                  </div>

                  {/* Insumos Requeridos */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCollapsedInsumos(prev => ({ ...prev, [pIdx]: !prev[pIdx] }))}
                        className="text-xs font-bold text-[#173865] bg-blue-50 px-3.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsedInsumos[pIdx] ? '-rotate-90' : 'rotate-0'}`} />
                        <span>Insumos ({prod.insumos?.length || 0})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCollapsedInsumos(prev => ({ ...prev, [pIdx]: false }));
                          addInsumo(pIdx);
                        }}
                        className="text-xs bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm text-[#173865] font-bold hover:bg-gray-50 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Insumo</span>
                      </button>
                    </div>

                    {!collapsedInsumos[pIdx] && (
                      <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                        {prod.insumos && prod.insumos.length > 0 && (
                          <div className={`hidden sm:grid ${
                            pedidoTipo === 'PEDIDO' 
                              ? 'sm:grid-cols-[minmax(140px,2fr)_minmax(95px,1.1fr)_minmax(85px,1fr)_minmax(95px,1.1fr)_minmax(95px,1.1fr)_52px_72px_80px_130px_28px]' 
                              : 'sm:grid-cols-[minmax(150px,2.2fr)_minmax(105px,1.2fr)_minmax(90px,1fr)_minmax(105px,1.2fr)_minmax(105px,1.2fr)_55px_75px_85px_28px]'
                          } gap-1.5 text-[10px] font-bold uppercase text-gray-400 px-2 pb-1 text-center`}>
                            <div>Insumo Requerido</div>
                            <div>Detalle</div>
                            <div>Medida</div>
                            <div>Nota</div>
                            <div>Proveedor</div>
                            <div>Cant</div>
                            <div>P. Unit</div>
                            <div>P. Total</div>
                            {pedidoTipo === 'PEDIDO' && <div>Método Pago</div>}
                            <div></div>
                          </div>
                        )}

                        {prod.insumos.map((ins, iIdx) => {
                          const totalInsumo = (parseFloat(ins.cant) || 1) * (parseFloat(ins.costoUnitario) || 0);
                          const insDropKey = `${pIdx}-${iIdx}`;
                          const filteredInv = inventario.filter(inv =>
                            !ins.nombre || inv.nombre.toLowerCase().includes(ins.nombre.toLowerCase())
                          );

                          return (
                            <div 
                              key={iIdx} 
                              className={`bg-white p-2 rounded-2xl border border-gray-200 grid grid-cols-1 ${
                                pedidoTipo === 'PEDIDO' 
                                  ? 'sm:grid-cols-[minmax(140px,2fr)_minmax(95px,1.1fr)_minmax(85px,1fr)_minmax(95px,1.1fr)_minmax(95px,1.1fr)_52px_72px_80px_130px_28px]' 
                                  : 'sm:grid-cols-[minmax(150px,2.2fr)_minmax(105px,1.2fr)_minmax(90px,1fr)_minmax(105px,1.2fr)_minmax(105px,1.2fr)_55px_75px_85px_28px]'
                              } gap-1.5 items-center text-xs shadow-sm`}
                            >
                              {/* Insumo */}
                              <div className="relative">
                                <input
                                  type="text"
                                  value={ins.nombre}
                                  onFocus={(e) => { e.stopPropagation(); setOpenInsumoDrop(insDropKey); }}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const match = inventario.find(inv => inv.nombre.toLowerCase().trim() === val.toLowerCase().trim());
                                    if (match) {
                                      handleSelectInsumoStock(pIdx, iIdx, match.nombre);
                                    } else {
                                      updateInsumo(pIdx, iIdx, 'nombre', val);
                                    }
                                    setOpenInsumoDrop(insDropKey);
                                  }}
                                  className="w-full bg-gray-50 text-gray-800 px-3 py-1.5 rounded-full border border-gray-200 text-xs focus:bg-white focus:ring-2 focus:ring-[#173865] focus:outline-none font-semibold text-center"
                                />
                                {openInsumoDrop === insDropKey && filteredInv.length > 0 && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-0 min-w-[220px] top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-48 overflow-y-auto animate-modal-in"
                                  >
                                    {filteredInv.map((inv) => (
                                      <div
                                        key={inv.id || inv.nombre}
                                        onClick={() => { handleSelectInsumoStock(pIdx, iIdx, inv.nombre); setOpenInsumoDrop(null); }}
                                        className="px-3.5 py-2 hover:bg-blue-50 cursor-pointer text-xs font-bold text-gray-700 flex justify-between items-center transition-colors"
                                      >
                                        <span className="truncate">{inv.nombre}</span>
                                        <span className="text-[11px] text-[#173865] font-black ml-2 whitespace-nowrap">${parseFloat(inv.precio || 0).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={ins.detalle || ''}
                                  onChange={(e) => updateInsumo(pIdx, iIdx, 'detalle', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-full border border-gray-200 text-xs text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173865]"
                                />
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={ins.medida || ''}
                                  onChange={(e) => updateInsumo(pIdx, iIdx, 'medida', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-full border border-gray-200 text-xs text-center font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173865]"
                                />
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={ins.nota || ''}
                                  onChange={(e) => updateInsumo(pIdx, iIdx, 'nota', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-full border border-gray-200 text-xs text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173865]"
                                />
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={ins.proveedor || ''}
                                  onChange={(e) => updateInsumo(pIdx, iIdx, 'proveedor', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-full border border-gray-200 text-xs text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173865]"
                                />
                              </div>

                              <div>
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={ins.cant}
                                  onChange={(e) => updateInsumo(pIdx, iIdx, 'cant', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-800 px-1.5 py-1.5 rounded-full border border-gray-200 text-xs text-center font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173865]"
                                />
                              </div>

                              <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-2 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#173865]">
                                <span className="text-gray-400 font-bold text-[11px] mr-0.5 select-none">$</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={ins.costoUnitario}
                                  onChange={(e) => updateInsumo(pIdx, iIdx, 'costoUnitario', e.target.value)}
                                  className="w-full bg-transparent border-none p-0 text-gray-800 text-xs text-center font-bold outline-none"
                                />
                              </div>

                              <div>
                                <input
                                  type="text"
                                  readOnly
                                  value={`$${totalInsumo.toFixed(2)}`}
                                  className="w-full bg-green-50 text-green-700 font-black px-2 py-1.5 rounded-full border border-green-200 text-xs text-center focus:outline-none cursor-default"
                                />
                              </div>

                              {pedidoTipo === 'PEDIDO' && (
                                <div>
                                  <select
                                    value={ins.metodoPago || 'STOCK'}
                                    onChange={(e) => updateInsumo(pIdx, iIdx, 'metodoPago', e.target.value)}
                                    className="select-pill w-full py-1.5 pl-3 pr-7 text-[11px] font-bold"
                                  >
                                    {METODOS_PAGO.map((m) => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeInsumo(pIdx, iIdx)}
                                  className="w-7 h-7 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                  title="Eliminar insumo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {(!prod.insumos || prod.insumos.length === 0) && (
                          <div className="text-xs text-gray-400 italic text-center py-2">Sin insumos definidos.</div>
                        )}
                      </div>
                    )}

                    {/* Mermas */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCollapsedMermas(prev => ({ ...prev, [pIdx]: !prev[pIdx] }))}
                        className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsedMermas[pIdx] ? '-rotate-90' : 'rotate-0'}`} />
                        <span>Mermas ({prod.mermas?.length || 0})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCollapsedMermas(prev => ({ ...prev, [pIdx]: false }));
                          addMerma(pIdx);
                        }}
                        className="text-xs bg-white border border-amber-300 px-3.5 py-1.5 rounded-full shadow-sm text-amber-900 font-bold hover:bg-amber-100 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Merma</span>
                      </button>
                    </div>

                    {!collapsedMermas[pIdx] && prod.mermas && prod.mermas.length > 0 && (
                      <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2">
                        <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold uppercase text-amber-800/70 px-2 pb-1">
                          <div className="sm:col-span-3 text-center">Material / Insumo</div>
                          <div className={pedidoTipo === 'PEDIDO' ? 'sm:col-span-2 text-center' : 'sm:col-span-3 text-center'}>
                            Motivo Merma
                          </div>
                          <div className="sm:col-span-1 text-center">Cant</div>
                          <div className="sm:col-span-2 text-center">Costo Unit.</div>
                          <div className="sm:col-span-2 text-center">Pérdida Total</div>
                          {pedidoTipo === 'PEDIDO' ? (
                            <div className="sm:col-span-2 text-center">Método Pago</div>
                          ) : (
                            <div className="sm:col-span-1 text-center"></div>
                          )}
                        </div>

                        {prod.mermas.map((merma, mIdx) => {
                          const cantMerma = parseFloat(merma.cant) || 1;
                          const cuMerma = parseFloat(merma.costoUnitario) || 0;
                          const totalMerma = cantMerma * cuMerma;
                          const merDropKey = `${pIdx}-${mIdx}`;
                          const filteredMerInv = inventario.filter(inv =>
                            !merma.material || inv.nombre.toLowerCase().includes(merma.material.toLowerCase())
                          );

                          return (
                            <div key={mIdx} className="bg-white p-2.5 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs shadow-sm">
                              <div className="sm:col-span-3 relative">
                                <input
                                  type="text"
                                  value={merma.material}
                                  onFocus={(e) => { e.stopPropagation(); setOpenMermaDrop(merDropKey); }}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const match = inventario.find(inv => inv.nombre.toLowerCase().trim() === val.toLowerCase().trim());
                                    if (match) {
                                      updateMerma(pIdx, mIdx, 'material', match.nombre);
                                      updateMerma(pIdx, mIdx, 'costoUnitario', match.precio || 0);
                                      updateMerma(pIdx, mIdx, 'metodoPago', 'STOCK');
                                    } else {
                                      updateMerma(pIdx, mIdx, 'material', val);
                                    }
                                    setOpenMermaDrop(merDropKey);
                                  }}
                                  className="w-full bg-gray-50 text-gray-800 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                {openMermaDrop === merDropKey && filteredMerInv.length > 0 && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-48 overflow-y-auto animate-modal-in"
                                  >
                                    {filteredMerInv.map((inv) => (
                                      <div
                                        key={inv.id || inv.nombre}
                                        onClick={() => {
                                          updateMerma(pIdx, mIdx, 'material', inv.nombre);
                                          updateMerma(pIdx, mIdx, 'costoUnitario', inv.precio || 0);
                                          updateMerma(pIdx, mIdx, 'metodoPago', 'STOCK');
                                          setOpenMermaDrop(null);
                                        }}
                                        className="px-3.5 py-2 hover:bg-amber-50 cursor-pointer text-xs font-bold text-gray-700 flex justify-between items-center transition-colors"
                                      >
                                        <span className="truncate">{inv.nombre}</span>
                                        <span className="text-[11px] text-amber-800 font-black ml-2 whitespace-nowrap">${parseFloat(inv.precio || 0).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className={pedidoTipo === 'PEDIDO' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                                <input
                                  type="text"
                                  value={merma.motivo}
                                  onChange={(e) => updateMerma(pIdx, mIdx, 'motivo', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-center focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={merma.cant}
                                  onChange={(e) => updateMerma(pIdx, mIdx, 'cant', e.target.value)}
                                  className="w-full bg-gray-50 text-red-600 px-2 py-1.5 rounded-full border border-gray-200 text-xs text-center font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={merma.costoUnitario}
                                  onChange={(e) => updateMerma(pIdx, mIdx, 'costoUnitario', e.target.value)}
                                  className="w-full bg-gray-50 text-gray-800 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-center font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={`-$${totalMerma.toFixed(2)}`}
                                  className="w-full bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-200 text-xs text-center font-black focus:outline-none cursor-default"
                                />
                              </div>

                              {pedidoTipo === 'PEDIDO' ? (
                                <div className="sm:col-span-2 flex items-center gap-1.5">
                                  <select
                                    value={merma.metodoPago || 'STOCK'}
                                    onChange={(e) => updateMerma(pIdx, mIdx, 'metodoPago', e.target.value)}
                                    className="select-pill w-full py-1.5 pl-3 pr-7 text-[11px] font-bold"
                                  >
                                    {METODOS_PAGO.map((m) => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => removeMerma(pIdx, mIdx)}
                                    className="w-7 h-7 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                                    title="Eliminar merma"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="sm:col-span-1 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeMerma(pIdx, mIdx)}
                                    className="w-7 h-7 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                                    title="Eliminar merma"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* 3. RESUMEN FINANCIERO Y BOTONES FIJOS */}
        <div className="sticky bottom-0 bg-gradient-to-r from-blue-50/95 via-indigo-50/95 to-blue-50/95 backdrop-blur-md border-t border-blue-200 p-4 sm:p-5 z-30 shadow-2xl space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#173865] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. Resumen Financiero en Vivo</span>
            </span>
            <span className="text-xs text-gray-500 font-bold">
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'} en total
            </span>
          </div>

          <div className={`grid gap-2.5 text-center ${
            !requiereFactura 
              ? 'grid-cols-2 sm:grid-cols-4' 
              : tipoPersona === 'Moral' 
                ? 'grid-cols-2 sm:grid-cols-6' 
                : 'grid-cols-2 sm:grid-cols-5'
          }`}>
            <div className="bg-white/95 p-2.5 rounded-2xl border border-blue-100 shadow-sm">
              <span className="text-[10px] text-gray-400 uppercase block font-bold">Subtotal Venta</span>
              <span className="font-black text-gray-800 text-xs sm:text-sm">${subtotal.toFixed(2)}</span>
            </div>

            {requiereFactura && (
              <div className="p-2.5 rounded-2xl border text-center bg-blue-100/70 border-blue-200 text-[#173865] shadow-sm">
                <span className="text-[10px] uppercase block font-bold">IVA (+16%)</span>
                <span className="font-black text-xs sm:text-sm">+${iva.toFixed(2)}</span>
              </div>
            )}

            {requiereFactura && tipoPersona === 'Moral' && (
              <div className="p-2.5 rounded-2xl border text-center bg-red-50 border-red-200 text-red-700 shadow-sm">
                <span className="text-[10px] uppercase block font-bold">Retención ISR (-1.25%)</span>
                <span className="font-black text-xs sm:text-sm">-${retencionIsr.toFixed(2)}</span>
              </div>
            )}

            <div className="bg-white/95 p-2.5 rounded-2xl border border-blue-200 shadow-sm">
              <span className="text-[10px] text-gray-400 uppercase block font-bold">Total a Cobrar</span>
              <span className="font-black text-[#173865] text-sm sm:text-base">${total.toFixed(2)}</span>
            </div>

            <div className="bg-white/95 p-2.5 rounded-2xl border border-blue-100 shadow-sm">
              <span className="text-[10px] text-gray-400 uppercase block font-bold">Costo Prod. Total</span>
              <span className="font-black text-gray-700 text-xs sm:text-sm">${costoTotal.toFixed(2)}</span>
            </div>

            <div className="bg-white/95 p-2.5 rounded-2xl border border-green-200 shadow-sm">
              <span className="text-[10px] text-green-700 uppercase block font-bold">Ganancia Neta</span>
              <span className="font-black text-green-600 text-xs sm:text-sm">${ganancia.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-blue-200/70">
            <div className="flex flex-wrap items-center gap-3.5">
              <div>
                <span className="text-[11px] text-gray-600 block font-bold mb-0.5 pl-2">Anticipo / Cobrado:</span>
                <div className="flex items-center bg-white rounded-full border border-green-200 px-3.5 py-1.5 shadow-sm w-36">
                  <span className="text-green-600 font-bold text-xs mr-1 select-none">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={pagado}
                    onChange={(e) => setPagado(e.target.value)}
                    className="w-full bg-transparent text-green-700 font-black text-xs outline-none"
                  />
                </div>
              </div>

              {parseFloat(pagado) > 0 && (
                <div>
                  <span className="text-[11px] text-[#173865] block font-bold mb-0.5 pl-2">Método de Pago Anticipo:</span>
                  <select
                    value={metodoPagoAnticipo}
                    onChange={(e) => setMetodoPagoAnticipo(e.target.value)}
                    className="select-pill py-1.5 text-xs font-bold"
                  >
                    <option value="NU MINA">NU MINA</option>
                    <option value="NU EMI">NU EMI</option>
                    <option value="MERCADO PAGO">MERCADO PAGO</option>
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="NU TDC">NU TDC</option>
                    <option value="PLATA TDC">PLATA TDC</option>
                  </select>
                </div>
              )}

              <div>
                <span className="text-[11px] text-gray-500 block font-bold mb-0.5">Saldo Pendiente:</span>
                <div className="font-black text-red-600 text-sm px-1 py-1">
                  ${Math.max(0, total - (parseFloat(pagado) || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 shadow-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#173865] hover:bg-blue-900 shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Guardando...' : `${isEditing ? 'Actualizar' : 'Crear'} ${pedidoTipo === 'COTIZACION' ? 'Cotización' : 'Pedido'}`}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
