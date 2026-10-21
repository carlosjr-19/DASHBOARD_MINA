import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Layers, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Building, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  FileCheck, 
  Tag,
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
  const isEditing = Boolean(initialData);

  const [pedidoTipo, setPedidoTipo] = useState(initialData?.tipo || tipo);
  const [folio, setFolio] = useState(initialData?.id || '');
  const [clienteNombre, setClienteNombre] = useState(initialData?.cliente || '');
  const [telefono, setTelefono] = useState(initialData?.telefono || '');
  const [correo, setCorreo] = useState(initialData?.correo || '');
  const todayIsoDate = new Date().toISOString().split('T')[0];
  const [fechaEntrega, setFechaEntrega] = useState(
    initialData?.fechaEntrega || initialData?.fecha?.split('T')[0] || todayIsoDate
  );
  const [requiereFactura, setRequiereFactura] = useState(initialData?.requiereFactura || false);
  const [tipoPersona, setTipoPersona] = useState(initialData?.tipoPersona || 'Fisica');
  const [rfc, setRfc] = useState(initialData?.rfc || '');
  const [razonSocial, setRazonSocial] = useState(initialData?.razonSocial || '');
  const [cp, setCp] = useState(initialData?.cp || '');
  const [regimenFiscal, setRegimenFiscal] = useState(initialData?.regimenFiscal || '612 Personas Físicas con Actividades Empresariales');
  const [usoCfdi, setUsoCfdi] = useState(initialData?.usoCfdi || 'G03 Gastos en general');
  const [pagado, setPagado] = useState(initialData?.pagado || 0);
  const [metodoPagoAnticipo, setMetodoPagoAnticipo] = useState(initialData?.metodoPagoAnticipo || 'NU MINA');
  const [collapsedInsumos, setCollapsedInsumos] = useState({});
  const [collapsedMermas, setCollapsedMermas] = useState({});

  // Products array
  const [productos, setProductos] = useState(() => {
    if (initialData?.productos && initialData.productos.length > 0) {
      return initialData.productos.map(p => ({
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
        // Cargar insumos predeterminados del catálogo si este producto aún no tiene insumos agregados
        if (matchCat.insumos && matchCat.insumos.length > 0 && (!updated[pIndex].insumos || updated[pIndex].insumos.length === 0)) {
          updated[pIndex].insumos = matchCat.insumos.map(i => ({
            nombre: i.nombre || '',
            detalle: i.detalle || '',
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

  const cargarInsumosDeCatalogo = (pIndex, catItem) => {
    if (!catItem || !catItem.insumos) return;
    const updated = [...productos];
    updated[pIndex].insumos = catItem.insumos.map(i => ({
      nombre: i.nombre || '',
      detalle: i.detalle || '',
      nota: i.nota || '',
      proveedor: i.proveedor || '',
      metodoPago: i.metodoPago || 'STOCK',
      cant: parseFloat(i.cant) || 1,
      costoUnitario: parseFloat(i.costoUnitario) || 0,
      costo: parseFloat(i.costo) || ((parseFloat(i.cant) || 1) * (parseFloat(i.costoUnitario) || 0))
    }));
    if (catItem.precio) updated[pIndex].precioUnitario = catItem.precio;
    if (catItem.proveedor) updated[pIndex].proveedor = catItem.proveedor;
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

    // Auto complete cost from stock item if name matches
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
  
  // Regla Fiscal separada:
  // Persona Física: Subtotal + IVA 16%
  // Persona Moral: Subtotal + IVA 16% - Retención ISR 1.25%
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
      onClose();
    } catch (err) {
      alert(err.message || 'Error al guardar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container más amplio (max-w-5xl) para que no esté amontonado */}
      <div className="bg-th-1b1c1e border border-gray-700 w-full max-w-7xl w-[96vw] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header Superior Fijo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-th-151618 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-100 text-sm sm:text-base">
              {isEditing ? 'Editar' : 'Crear'} {pedidoTipo === 'COTIZACION' ? 'Presupuesto / Cotización' : 'Pedido'}
            </span>

            {!isEditing && (
              <div className="flex items-center bg-th-111213 rounded-lg p-0.5 border border-gray-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPedidoTipo('PEDIDO')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    pedidoTipo === 'PEDIDO' ? 'bg-orange-600 text-white shadow' : 'text-gray-400'
                  }`}
                >
                  Pedido
                </button>
                <button
                  type="button"
                  onClick={() => setPedidoTipo('COTIZACION')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    pedidoTipo === 'COTIZACION' ? 'bg-blue-600 text-white shadow' : 'text-gray-400'
                  }`}
                >
                  Cotización
                </button>
              </div>
            )}

            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-orange-950/80 text-orange-400 border border-orange-800/80">
              {folio}
            </span>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 p-1 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll central para Secciones 1 y 2 */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs flex-1">
          
          {/* 1. Datos del Cliente */}
          <div className="bg-th-141517 p-4 rounded-xl border border-gray-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              1. Datos del Cliente
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Nombre / Empresa *</label>
                <input
                  type="text"
                  required
                  list="clientes-list"
                  value={clienteNombre}
                  onChange={(e) => handleSelectCliente(e.target.value)}
                  placeholder="Escribe o selecciona..."
                  className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
                <datalist id="clientes-list">
                  {clientes.map((c, i) => (
                    <option key={i} value={c.nombre} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">WhatsApp / Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="10 dígitos"
                  className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Fecha de Solicitud (Clic para cambiar fecha)</label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:ring-1 focus:ring-orange-500 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Facturación Electrónica */}
            <div className="pt-3 border-t border-gray-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={requiereFactura}
                    onChange={(e) => setRequiereFactura(e.target.checked)}
                    className="rounded bg-gray-800 border-gray-700 text-orange-600 focus:ring-0 w-4 h-4"
                  />
                  <span className="font-semibold text-xs sm:text-sm">¿Requiere Factura Electrónica (CFDI)?</span>
                </label>

                {requiereFactura && (
                  <div className="flex items-center gap-2 bg-th-101112 p-1 rounded-lg border border-gray-700 text-xs">
                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      tipoPersona === 'Fisica' ? 'bg-orange-600/30 text-orange-300 font-bold border border-orange-500/40' : 'text-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="Fisica"
                        checked={tipoPersona === 'Fisica'}
                        onChange={(e) => setTipoPersona(e.target.value)}
                        className="text-orange-600 focus:ring-0"
                      />
                      <span>Persona Física (+16% IVA)</span>
                    </label>

                    <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                      tipoPersona === 'Moral' ? 'bg-orange-600/30 text-orange-300 font-bold border border-orange-500/40' : 'text-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="tipoPersona"
                        value="Moral"
                        checked={tipoPersona === 'Moral'}
                        onChange={(e) => setTipoPersona(e.target.value)}
                        className="text-orange-600 focus:ring-0"
                      />
                      <span>Persona Moral (+IVA -1.25% ISR)</span>
                    </label>
                  </div>
                )}
              </div>

              {requiereFactura && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-th-101112 rounded-xl border border-gray-800 animate-in fade-in">
                  <div>
                    <label className="text-gray-400 block mb-1">RFC</label>
                    <input
                      type="text"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      className="w-full bg-th-1c1d1f text-gray-100 p-2 rounded border border-gray-700 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Razón Social</label>
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Nombre fiscal de la empresa"
                      className="w-full bg-th-1c1d1f text-gray-100 p-2 rounded border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Código Postal (CP)</label>
                    <input
                      type="text"
                      value={cp}
                      onChange={(e) => setCp(e.target.value)}
                      placeholder="72000"
                      className="w-full bg-th-1c1d1f text-gray-100 p-2 rounded border border-gray-700 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Productos y Servicios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                2. Productos y Servicios ({productos.length})
              </span>
              <button
                type="button"
                onClick={addProducto}
                className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-semibold px-3 py-1.5 rounded-lg bg-orange-950/30 border border-orange-900/40 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-gray-50" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {productos.map((prod, pIdx) => {
              const cantP = parseFloat(prod.cant) || 1;
              const puP = parseFloat(prod.precioUnitario) || 0;
              const precioTotalProd = cantP * puP;

              return (
                <div key={pIdx} className="bg-th-141517 p-4 rounded-xl border border-gray-800 space-y-3.5 shadow-sm">
                  
                  {/* Cabecera del Producto */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <span className="font-bold text-gray-200 text-sm">Producto #{pIdx + 1}</span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase block">Total Producto:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          ${precioTotalProd.toFixed(2)}
                        </span>
                      </div>
                      {productos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProducto(pIdx)}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hilera de Producto con Precio Total al final */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-gray-400 block">Descripción / Producto *</label>
                        {prod.nombre && catalogo.find(c => c.nombre.toLowerCase() === prod.nombre.trim().toLowerCase()) && (
                          <span className="text-[10px] text-orange-400 font-semibold bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/60">
                            En Catálogo
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        list={`catalogo-list-${pIdx}`}
                        value={prod.nombre}
                        onChange={(e) => updateProducto(pIdx, 'nombre', e.target.value)}
                        placeholder="Escribe o selecciona del catálogo..."
                        className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                      />
                      <datalist id={`catalogo-list-${pIdx}`}>
                        {catalogo.map((cat, cIdx) => (
                          <option key={cIdx} value={cat.nombre}>
                            {cat.nombre} - ${cat.precio} (Costo insumos: ${cat.costo})
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-400 block mb-1 text-center">Proveedor</label>
                      <input
                        type="text"
                        value={prod.proveedor}
                        onChange={(e) => updateProducto(pIdx, 'proveedor', e.target.value)}
                        placeholder="Ej. Papelera / Propio"
                        className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-gray-400 block mb-1 text-center">Nota / Detalle</label>
                      <input
                        type="text"
                        value={prod.nota}
                        onChange={(e) => updateProducto(pIdx, 'nota', e.target.value)}
                        placeholder="Talla, color, etc."
                        className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-gray-400 block mb-1 text-center">Cant</label>
                      <input
                        type="number"
                        min="1"
                        value={prod.cant}
                        onChange={(e) => updateProducto(pIdx, 'cant', e.target.value)}
                        className="w-full bg-th-1c1d1f text-gray-100 p-2.5 rounded-lg border border-gray-700 text-center font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-gray-400 block mb-1 text-center">P. Unit ($)</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-2 text-gray-400 font-mono text-xs select-none">$</span>
                        <input
                          type="number"
                          step="any"
                          value={prod.precioUnitario}
                          onChange={(e) => updateProducto(pIdx, 'precioUnitario', e.target.value)}
                          className="w-full bg-th-1c1d1f text-gray-100 font-mono py-2.5 pl-5 pr-1.5 rounded-lg border border-gray-700 text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Precio Total al final calculado automáticamente */}
                    <div className="sm:col-span-2">
                      <label className="text-emerald-400 font-bold block mb-1 text-center">Precio Total ($)</label>
                      <input
                        type="text"
                        readOnly
                        value={`$${precioTotalProd.toFixed(2)}`}
                        className="w-full bg-th-121314 text-emerald-400 font-bold p-2.5 rounded-lg border border-gray-700 text-center text-sm focus:outline-none cursor-default"
                      />
                    </div>
                  </div>

                  {/* Insumos Requeridos: Columnas exactas solicitadas */}
                  <div className="space-y-2.5 pt-3 border-t border-gray-800/80">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCollapsedInsumos(prev => ({ ...prev, [pIdx]: !prev[pIdx] }))}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400 hover:text-gray-50 transition-colors"
                        title={collapsedInsumos[pIdx] ? "Mostrar listado de insumos" : "Ocultar listado de insumos"}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsedInsumos[pIdx] ? '-rotate-90 text-gray-500' : 'rotate-0 text-orange-400'}`} />
                        <span>Insumos Requeridos ({prod.insumos?.length || 0})</span>
                        <span className="text-[9px] text-gray-500 font-normal lowercase">{collapsedInsumos[pIdx] ? '(abrir)' : '(ocultar)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCollapsedInsumos(prev => ({ ...prev, [pIdx]: false }));
                          addInsumo(pIdx);
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-50" />
                        <span>Añadir Insumo</span>
                      </button>
                    </div>

                    {!collapsedInsumos[pIdx] && (
                      <>

                    {/* Encabezado de columnas de Insumos */}
                    {prod.insumos && prod.insumos.length > 0 && (
                      <div className={`hidden sm:grid ${
                        pedidoTipo === 'PEDIDO' 
                          ? 'sm:grid-cols-[minmax(140px,2fr)_minmax(95px,1.1fr)_minmax(85px,1fr)_minmax(95px,1.1fr)_minmax(95px,1.1fr)_52px_72px_80px_115px_28px]' 
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

                      return (
                        <div 
                          key={iIdx} 
                          className={`bg-th-1c1d1f p-2 rounded-lg border border-gray-800 grid grid-cols-1 ${
                            pedidoTipo === 'PEDIDO' 
                              ? 'sm:grid-cols-[minmax(140px,2fr)_minmax(95px,1.1fr)_minmax(85px,1fr)_minmax(95px,1.1fr)_minmax(95px,1.1fr)_52px_72px_80px_115px_28px]' 
                              : 'sm:grid-cols-[minmax(150px,2.2fr)_minmax(105px,1.2fr)_minmax(90px,1fr)_minmax(105px,1.2fr)_minmax(105px,1.2fr)_55px_75px_85px_28px]'
                          } gap-1.5 items-center text-[11px]`}
                        >
                          {/* Insumo */}
                          <div>
                            <input
                              type="text"
                              list={`insumos-stock-list-${pIdx}-${iIdx}`}
                              placeholder="Escribe o elige..."
                              value={ins.nombre}
                              onChange={(e) => {
                                const val = e.target.value;
                                const match = inventario.find(inv => inv.nombre.toLowerCase().trim() === val.toLowerCase().trim());
                                if (match) {
                                  handleSelectInsumoStock(pIdx, iIdx, match.nombre);
                                } else {
                                  updateInsumo(pIdx, iIdx, 'nombre', val);
                                }
                              }}
                              className="w-full bg-th-121314 text-gray-200 px-2 py-1.5 rounded border border-gray-700 text-[11px] focus:ring-1 focus:ring-orange-500 font-medium text-center"
                            />
                            <datalist id={`insumos-stock-list-${pIdx}-${iIdx}`}>
                              {inventario.map((inv) => (
                                <option key={inv.id || inv.nombre} value={inv.nombre}>
                                  {inv.nombre} | Stock: {inv.stock} | ${parseFloat(inv.precio || 0).toFixed(2)}{inv.proveedor ? ` | ${inv.proveedor}` : ''}
                                </option>
                              ))}
                            </datalist>
                          </div>

                          {/* Detalle */}
                          <div>
                            <input
                              type="text"
                              placeholder="Detalle..."
                              value={ins.detalle || ''}
                              onChange={(e) => updateInsumo(pIdx, iIdx, 'detalle', e.target.value)}
                              className="w-full bg-th-121314 text-gray-200 px-1.5 py-1.5 rounded border border-gray-700 text-[11px] text-center"
                            />
                          </div>

                          {/* Medida */}
                          <div>
                            <input
                              type="text"
                              placeholder="Medida (ej. 58x100)"
                              value={ins.medida || ''}
                              onChange={(e) => updateInsumo(pIdx, iIdx, 'medida', e.target.value)}
                              className="w-full bg-th-121314 text-gray-200 px-1.5 py-1.5 rounded border border-gray-700 text-[11px] text-center font-mono"
                            />
                          </div>

                          {/* Nota */}
                          <div>
                            <input
                              type="text"
                              placeholder="Nota..."
                              value={ins.nota || ''}
                              onChange={(e) => updateInsumo(pIdx, iIdx, 'nota', e.target.value)}
                              className="w-full bg-th-121314 text-gray-200 px-1.5 py-1.5 rounded border border-gray-700 text-[11px] text-center"
                            />
                          </div>

                          {/* Proveedor */}
                          <div>
                            <input
                              type="text"
                              placeholder="Proveedor"
                              value={ins.proveedor || ''}
                              onChange={(e) => updateInsumo(pIdx, iIdx, 'proveedor', e.target.value)}
                              className="w-full bg-th-121314 text-gray-200 px-1.5 py-1.5 rounded border border-gray-700 text-[11px] text-center"
                            />
                          </div>

                          {/* Cantidad */}
                          <div>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              placeholder="Cant"
                              value={ins.cant}
                              onChange={(e) => updateInsumo(pIdx, iIdx, 'cant', e.target.value)}
                              className="w-full bg-th-121314 text-gray-200 px-1 py-1.5 rounded border border-gray-700 text-[11px] text-center font-bold"
                            />
                          </div>

                          {/* Precio Unitario */}
                          <div>
                            <input
                              type="number"
                              step="any"
                              placeholder="P. Unit"
                              value={ins.costoUnitario}
                              onChange={(e) => updateInsumo(pIdx, iIdx, 'costoUnitario', e.target.value)}
                              className="w-full bg-th-121314 text-gray-200 px-1 py-1.5 rounded border border-gray-700 text-[11px] text-center font-mono font-medium"
                            />
                          </div>

                          {/* Precio Total (sin truncate, tamaño legible completo) */}
                          <div>
                            <input
                              type="text"
                              readOnly
                              value={`$${totalInsumo.toFixed(2)}`}
                              className="w-full bg-th-121314 text-emerald-400 font-mono font-bold px-1 py-1.5 rounded border border-gray-700 text-[11px] text-center focus:outline-none cursor-default whitespace-nowrap"
                            />
                          </div>

                          {/* Método Pago (si PEDIDO) */}
                          {pedidoTipo === 'PEDIDO' && (
                            <div>
                              <select
                                value={ins.metodoPago || 'STOCK'}
                                onChange={(e) => updateInsumo(pIdx, iIdx, 'metodoPago', e.target.value)}
                                className="w-full bg-th-121314 text-gray-200 px-1 py-1.5 rounded border border-gray-700 text-[10px] text-center font-medium"
                              >
                                {METODOS_PAGO.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Botón Borrar Insumo */}
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeInsumo(pIdx, iIdx)}
                              className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                              title="Eliminar insumo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                      </>
                    )}

                    {/* Mermas: Acordeón para abrir y cerrar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setCollapsedMermas(prev => ({ ...prev, [pIdx]: !prev[pIdx] }))}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-rose-400 hover:text-rose-300 transition-colors"
                        title={collapsedMermas[pIdx] ? "Mostrar listado de mermas" : "Ocultar listado de mermas"}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsedMermas[pIdx] ? '-rotate-90 text-rose-500/50' : 'rotate-0 text-rose-400'}`} />
                        <span>Mermas / Desperdicio ({prod.mermas?.length || 0})</span>
                        <span className="text-[9px] text-gray-500 font-normal lowercase">{collapsedMermas[pIdx] ? '(abrir)' : '(ocultar)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCollapsedMermas(prev => ({ ...prev, [pIdx]: false }));
                          addMerma(pIdx);
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-50" />
                        <span>Añadir Merma</span>
                      </button>
                    </div>

                    {!collapsedMermas[pIdx] && (
                      <>
                        {prod.mermas && prod.mermas.length > 0 && (
                          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold uppercase text-rose-400/80 px-2 pb-1">
                            <div className="sm:col-span-3 text-center">Material / Insumo</div>
                            <div className={pedidoTipo === 'PEDIDO' ? 'sm:col-span-2 text-center' : 'sm:col-span-3 text-center'}>
                              Motivo Merma
                            </div>
                            <div className="sm:col-span-1 text-center">Cant</div>
                            <div className="sm:col-span-2 text-center">Costo Unit.</div>
                            <div className="sm:col-span-2 text-center">Costo Total</div>
                            {pedidoTipo === 'PEDIDO' ? (
                              <div className="sm:col-span-2 text-center">Método Pago</div>
                            ) : (
                              <div className="sm:col-span-1 text-center"></div>
                            )}
                          </div>
                        )}

                        {prod.mermas.map((merma, mIdx) => {
                          const cantMerma = parseFloat(merma.cant) || 1;
                          const cuMerma = parseFloat(merma.costoUnitario) || 0;
                          const totalMerma = cantMerma * cuMerma;

                          return (
                            <div key={mIdx} className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                              {/* Material / Insumo */}
                              <div className="sm:col-span-3">
                                <input
                                  type="text"
                                  list={`merma-stock-list-${pIdx}-${mIdx}`}
                                  placeholder="Escribe o elige del stock..."
                                  value={merma.material}
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
                                  }}
                                  className="w-full bg-th-121314 text-rose-200 p-2 rounded border border-rose-900/60 text-xs text-center"
                                />
                                <datalist id={`merma-stock-list-${pIdx}-${mIdx}`}>
                                  {inventario.map((inv) => (
                                    <option key={inv.id || inv.nombre} value={inv.nombre}>
                                      {inv.nombre} | Stock: {inv.stock} | ${parseFloat(inv.precio || 0).toFixed(2)}{inv.proveedor ? ` | ${inv.proveedor}` : ''}
                                    </option>
                                  ))}
                                </datalist>
                              </div>

                              {/* Motivo Merma */}
                              <div className={pedidoTipo === 'PEDIDO' ? 'sm:col-span-2' : 'sm:col-span-3'}>
                                <input
                                  type="text"
                                  placeholder="Motivo (ej. Error corte)"
                                  value={merma.motivo}
                                  onChange={(e) => updateMerma(pIdx, mIdx, 'motivo', e.target.value)}
                                  className="w-full bg-th-121314 text-rose-200 p-2 rounded border border-rose-900/60 text-xs text-center"
                                />
                              </div>

                              {/* Cant */}
                              <div className="sm:col-span-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  placeholder="Cant"
                                  value={merma.cant}
                                  onChange={(e) => updateMerma(pIdx, mIdx, 'cant', e.target.value)}
                                  className="w-full bg-th-121314 text-rose-200 p-2 rounded border border-rose-900/60 text-xs text-center font-bold"
                                />
                              </div>

                              {/* Costo Unitario */}
                              <div className="sm:col-span-2">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="Costo U."
                                  value={merma.costoUnitario}
                                  onChange={(e) => updateMerma(pIdx, mIdx, 'costoUnitario', e.target.value)}
                                  className="w-full bg-th-121314 text-rose-200 p-2 rounded border border-rose-900/60 text-xs text-center font-bold"
                                />
                              </div>

                              {/* Costo Total Merma (con estilo idéntico de input a P. Unit) */}
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={`$${totalMerma.toFixed(2)}`}
                                  className="w-full bg-th-121314 text-rose-200 p-2 rounded border border-rose-900/60 text-xs text-center font-bold focus:outline-none cursor-default"
                                />
                              </div>

                              {/* Método Pago y Borrar (Solo en Pedido) */}
                              {pedidoTipo === 'PEDIDO' ? (
                                <div className="sm:col-span-2 flex items-center gap-1.5">
                                  <select
                                    value={merma.metodoPago || 'STOCK'}
                                    onChange={(e) => updateMerma(pIdx, mIdx, 'metodoPago', e.target.value)}
                                    className="w-full bg-th-121314 text-rose-200 p-2 rounded border border-rose-900/60 text-xs text-center font-medium"
                                  >
                                    {METODOS_PAGO.map((m) => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => removeMerma(pIdx, mIdx)}
                                    className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                                    title="Eliminar merma"
                                  >
                                    <X className="w-4 h-4 text-gray-50" />
                                  </button>
                                </div>
                              ) : (
                                <div className="sm:col-span-1 flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeMerma(pIdx, mIdx)}
                                    className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                                    title="Eliminar merma"
                                  >
                                    <X className="w-4 h-4 text-gray-50" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        {/* 3. RESUMEN FINANCIERO Y BOTONES FIJOS EN LA PANTALLA EN TODO MOMENTO */}
        <div className="sticky bottom-0 bg-th-141517 border-t border-gray-700/80 p-3 sm:p-4 z-30 shadow-2xl space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>3. Resumen Financiero en Vivo</span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'} en total
            </span>
          </div>

          {/* Cajas financieras condicionales según facturación */}
          <div className={`grid gap-2 text-center ${
            !requiereFactura 
              ? 'grid-cols-2 sm:grid-cols-4' 
              : tipoPersona === 'Moral' 
                ? 'grid-cols-2 sm:grid-cols-6' 
                : 'grid-cols-2 sm:grid-cols-5'
          }`}>
            {/* 1. Subtotal */}
            <div className="bg-th-1c1d1f p-2 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Subtotal Venta</span>
              <span className="font-mono font-bold text-gray-200 text-xs sm:text-sm">${subtotal.toFixed(2)}</span>
            </div>

            {/* 2. IVA 16% (Solo si requiere factura) */}
            {requiereFactura && (
              <div className="p-2 rounded-lg border text-center bg-blue-950/40 border-blue-800/80 text-blue-300">
                <span className="text-[10px] uppercase block font-semibold">IVA (+16%)</span>
                <span className="font-mono font-bold text-xs sm:text-sm">
                  +${iva.toFixed(2)}
                </span>
              </div>
            )}

            {/* 3. Retención ISR -1.25% (Solo si requiere factura Y es Persona Moral) */}
            {requiereFactura && tipoPersona === 'Moral' && (
              <div className="p-2 rounded-lg border text-center bg-rose-950/40 border-rose-800/80 text-rose-300">
                <span className="text-[10px] uppercase block font-semibold">Retención ISR (-1.25%)</span>
                <span className="font-mono font-bold text-xs sm:text-sm">
                  -${retencionIsr.toFixed(2)}
                </span>
              </div>
            )}

            {/* 4. Total del Pedido */}
            <div className="bg-th-1c1d1f p-2 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Total a Cobrar</span>
              <span className="font-mono font-bold text-orange-400 text-xs sm:text-base">${total.toFixed(2)}</span>
            </div>

            {/* 5. Costo Prod. Total */}
            <div className="bg-th-1c1d1f p-2 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Costo Prod. Total</span>
              <span className="font-mono font-bold text-gray-300 text-xs sm:text-sm">${costoTotal.toFixed(2)}</span>
            </div>

            {/* 6. Ganancia Proyectada */}
            <div className="bg-th-1c1d1f p-2 rounded-lg border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Ganancia Neta</span>
              <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">${ganancia.toFixed(2)}</span>
            </div>
          </div>

          {/* Fila de Anticipo, Saldo y Botones de Acción directos */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-gray-800/80">
            <div className="flex flex-wrap items-center gap-3.5">
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold mb-0.5">Anticipo / Cobrado:</span>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-emerald-400 font-mono font-bold text-xs select-none">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={pagado}
                    onChange={(e) => setPagado(e.target.value)}
                    className="bg-th-1c1d1f text-emerald-400 font-mono font-bold pl-6 pr-2.5 py-1.5 rounded-lg border border-gray-700 w-32 text-xs focus:outline-none focus:border-orange-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {parseFloat(pagado) > 0 && (
                <div className="animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[10px] text-orange-400 block font-semibold mb-0.5">Método de Pago Anticipo:</span>
                  <select
                    value={metodoPagoAnticipo}
                    onChange={(e) => setMetodoPagoAnticipo(e.target.value)}
                    className="bg-th-1c1d1f text-orange-300 text-xs px-2.5 py-1.5 rounded-lg border border-orange-500/70 focus:outline-none font-semibold shadow-sm"
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
                <span className="text-[10px] text-gray-400 block font-semibold mb-0.5">Saldo Pendiente:</span>
                <div className="font-mono font-bold text-rose-400 text-sm px-1 py-1">
                  ${Math.max(0, total - (parseFloat(pagado) || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Botones de Acción (Siempre Visibles) */}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-950/40 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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
