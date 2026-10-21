from pydantic import BaseModel
from typing import List, Optional

# --- INSUMOS Y MERMAS ---
class InsumoSchema(BaseModel):
    nombre: str
    detalle: Optional[str] = ""
    medida: Optional[str] = ""
    nota: Optional[str] = ""
    proveedor: Optional[str] = ""
    metodoPago: Optional[str] = "STOCK"
    cant: float = 1.0
    costoUnitario: float = 0.0
    costo: float = 0.0

class MermaSchema(BaseModel):
    material: str
    cant: float = 1.0
    motivo: Optional[str] = ""
    costoUnitario: float = 0.0
    metodoPago: Optional[str] = "STOCK"

class ProductoItemSchema(BaseModel):
    nombre: str
    proveedor: Optional[str] = ""
    cant: float = 1.0
    precioUnitario: float = 0.0
    costoUnitario: float = 0.0
    nota: Optional[str] = ""
    insumos: List[InsumoSchema] = []
    mermas: List[MermaSchema] = []


# --- PEDIDOS Y COTIZACIONES ---
class PedidoCreateSchema(BaseModel):
    id: str
    tipo: Optional[str] = "PEDIDO"
    fecha: Optional[str] = None
    cliente: str
    requiereFactura: bool = False
    tipoPersona: Optional[str] = "Fisica"
    subtotal: float = 0.0
    iva: float = 0.0
    retencionIsr: float = 0.0
    total: float = 0.0
    pagado: float = 0.0
    metodoPagoAnticipo: Optional[str] = "NU MINA"
    costoTotal: float = 0.0
    costoMermasTotal: float = 0.0
    ganancia: float = 0.0
    estatus: str = "Pendiente"
    facturaEstatus: Optional[str] = "-"
    facturaFecha: Optional[str] = None
    facturaArchivoData: Optional[str] = None
    facturaArchivoNombre: Optional[str] = None
    rfc: Optional[str] = None
    razonSocial: Optional[str] = None
    cp: Optional[str] = None
    regimenFiscal: Optional[str] = None
    usoCfdi: Optional[str] = None
    fechaEntrega: Optional[str] = None
    motivoCancelacion: Optional[str] = None
    cotizacionOrigen: Optional[str] = None
    convertidaAPedido: Optional[str] = None
    productos: List[ProductoItemSchema] = []

# --- CLIENTES ---
class ClienteSchema(BaseModel):
    nombre: str
    rfc: Optional[str] = ""
    cp: Optional[str] = ""
    regimen: Optional[str] = ""
    usoCfdi: Optional[str] = ""
    correo: Optional[str] = ""
    telefono: Optional[str] = ""
    pedidos: Optional[int] = 0
    deuda: Optional[float] = 0.0
    ganancia: Optional[float] = 0.0

# --- INVENTARIO ---
class InsumoInventarioSchema(BaseModel):
    id: Optional[int] = None
    nombre: str
    proveedor: Optional[str] = "Propio"
    precio: float = 0.0
    stock: float = 0.0
    alerta: float = 5.0

# --- MOVIMIENTO CAJA ---
class MovimientoCajaSchema(BaseModel):
    id: Optional[str] = None
    fecha: Optional[str] = None
    tipo: str # INGRESO o EGRESO
    cuenta: str # NU MINA, NU EMI, MERCADO PAGO, EFECTIVO, NU TDC, PLATA TDC
    monto: float
    detalle: str
    pedidoId: Optional[str] = None
    categoria: Optional[str] = "Otros"
    nota: Optional[str] = ""

# --- RECOLECCION ---
class RecoleccionRepartoItem(BaseModel):
    pedidoId: str
    porcion: float
    itemsCount: Optional[int] = 1

class RecoleccionSchema(BaseModel):
    id: Optional[str] = None
    fecha: Optional[str] = None
    cuenta: Optional[str] = "NU MINA"
    cuentaGasolina: Optional[str] = "NU TDC"
    cuentaDesayuno: Optional[str] = "EFECTIVO"
    cuentaOtros: Optional[str] = "NU EMI"
    gastoGasolina: float = 0.0
    gastoDesayuno: float = 0.0
    gastoOtros: float = 0.0
    totalGasto: float = 0.0
    nota: Optional[str] = ""
    pedidosIds: List[str] = []
    reparto: Optional[List[RecoleccionRepartoItem]] = []

# --- CALCULADORA ---
class MaterialCalculadoraSchema(BaseModel):
    id: Optional[int] = None
    nombre: str
    proveedor: Optional[str] = "Propio"
    ancho: float = 100.0
    alto: float = 100.0
    costo: float = 0.0

# --- PRODUCTO CATALOGO ---
class ProductoCatalogoSchema(BaseModel):
    id: Optional[int] = None
    nombre: str
    proveedor: Optional[str] = "Propio"
    costo: float = 0.0
    margen: float = 0.0
    precio: float = 0.0
    insumos: List[InsumoSchema] = []

# --- FACTURAS CFDI & RESICO ---
class FacturaCFDISchema(BaseModel):
    id: Optional[str] = None
    tipo: str # EMITIDA o RECIBIDA
    uuid: Optional[str] = ""
    serie: Optional[str] = ""
    folio: Optional[str] = ""
    fecha: Optional[str] = None
    rfcEmisor: Optional[str] = ""
    nombreEmisor: Optional[str] = ""
    rfcReceptor: Optional[str] = ""
    nombreReceptor: Optional[str] = ""
    usoCfdi: Optional[str] = ""
    metodoPago: Optional[str] = "PUE"
    formaPago: Optional[str] = "03"
    moneda: Optional[str] = "MXN"
    subtotal: float = 0.0
    descuento: float = 0.0
    ivaTrasladado: float = 0.0
    ivaRetenido: float = 0.0
    isrRetenido: float = 0.0
    total: float = 0.0
    categoria: Optional[str] = "Insumos"
    descripcion: Optional[str] = ""
    archivoNombre: Optional[str] = ""
    esDeducibleIva: Optional[bool] = True
    porcentajeDeducible: Optional[float] = 100.0
    comentarioContador: Optional[str] = ""

class FacturaXMLUploadSchema(BaseModel):
    tipo: Optional[str] = "AUTO" # EMITIDA, RECIBIDA o AUTO
    xmlContent: str
    archivoNombre: Optional[str] = "factura.xml"

