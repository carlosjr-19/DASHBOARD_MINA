from sqlalchemy import Column, Integer, String, Float, Boolean, Date, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import datetime

class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(String, primary_key=True, index=True) # e.g. PMD-001, CMD-001
    tipo = Column(String, default="PEDIDO") # PEDIDO o COTIZACION
    fecha = Column(String, default=lambda: datetime.date.today().isoformat())
    cliente = Column(String, index=True)
    requiere_factura = Column(Boolean, default=False)
    tipo_persona = Column(String, default="Fisica")
    
    subtotal = Column(Float, default=0.0)
    iva = Column(Float, default=0.0)
    retencion_isr = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    pagado = Column(Float, default=0.0)
    metodo_pago_anticipo = Column(String, default="NU MINA")
    costo_insumos = Column(Float, default=0.0)
    costo_mermas = Column(Float, default=0.0)
    ganancia_neta = Column(Float, default=0.0)
    
    estatus = Column(String, default="Pendiente") # Pendiente, En Proceso, Terminado, Entregado, Cancelado, Cotización, Convertida
    factura_estatus = Column(String, default="-") # -, Pendiente, Generada
    factura_fecha = Column(String, nullable=True)
    factura_archivo_data = Column(Text, nullable=True)
    factura_archivo_nombre = Column(String, nullable=True)
    
    # Datos fiscales
    rfc = Column(String, nullable=True)
    razon_social = Column(String, nullable=True)
    cp = Column(String, nullable=True)
    regimen_fiscal = Column(String, nullable=True)
    uso_cfdi = Column(String, nullable=True)
    
    fecha_entrega = Column(String, nullable=True)
    motivo_cancelacion = Column(Text, nullable=True)
    cotizacion_origen = Column(String, nullable=True)
    convertida_a_pedido = Column(String, nullable=True)

    productos = relationship("PedidoProducto", back_populates="pedido", cascade="all, delete-orphan")


class PedidoProducto(Base):
    __tablename__ = "pedido_productos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pedido_id = Column(String, ForeignKey("pedidos.id"), index=True)
    nombre = Column(String)
    proveedor = Column(String, nullable=True)
    cant = Column(Float, default=1.0)
    precio_unitario = Column(Float, default=0.0)
    costo_unitario = Column(Float, default=0.0)
    nota = Column(String, nullable=True)

    pedido = relationship("Pedido", back_populates="productos")
    insumos = relationship("PedidoInsumo", back_populates="producto", cascade="all, delete-orphan")
    mermas = relationship("PedidoMerma", back_populates="producto", cascade="all, delete-orphan")


class PedidoInsumo(Base):
    __tablename__ = "pedido_insumos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    producto_id = Column(Integer, ForeignKey("pedido_productos.id"), index=True)
    pedido_id = Column(String, index=True)
    nombre = Column(String)
    detalle = Column(String, nullable=True)
    medida = Column(String, default="")
    nota = Column(String, nullable=True)
    proveedor = Column(String, nullable=True)
    metodo_pago = Column(String, default="STOCK") # STOCK, NU MINA, NU EMI, MERCADO PAGO, EFECTIVO, NU TDC, PLATA TDC
    cant = Column(Float, default=1.0)
    costo_unitario = Column(Float, default=0.0)
    costo = Column(Float, default=0.0)


    producto = relationship("PedidoProducto", back_populates="insumos")


class PedidoMerma(Base):
    __tablename__ = "pedido_mermas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    producto_id = Column(Integer, ForeignKey("pedido_productos.id"), index=True)
    material = Column(String)
    cant = Column(Float, default=1.0)
    motivo = Column(String, nullable=True)
    costo_unitario = Column(Float, default=0.0)
    metodo_pago = Column(String, default="STOCK")

    producto = relationship("PedidoProducto", back_populates="mermas")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, unique=True, index=True)
    rfc = Column(String, default="")
    cp = Column(String, default="")
    regimen = Column(String, default="")
    uso_cfdi = Column(String, default="")
    correo = Column(String, default="")
    telefono = Column(String, default="")
    pedidos_totales = Column(Integer, default=0)
    deuda = Column(Float, default=0.0)
    ganancia_total = Column(Float, default=0.0)


class InsumoInventario(Base):
    __tablename__ = "inventario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, unique=True, index=True)
    proveedor = Column(String, default="Propio")
    precio = Column(Float, default=0.0)
    stock = Column(Float, default=0.0)
    alerta = Column(Float, default=5.0)

    movimientos = relationship("MovimientoInventario", back_populates="insumo", cascade="all, delete-orphan")


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True, autoincrement=True)
    insumo_id = Column(Integer, ForeignKey("inventario.id"), index=True, nullable=True)
    insumo_nombre = Column(String, index=True)
    pedido_id = Column(String, index=True)
    tipo = Column(String, default="CONSUMO") # CONSUMO o MERMA
    cant = Column(Float, default=0.0)
    fecha = Column(String, default=lambda: datetime.date.today().isoformat())
    motivo = Column(String, nullable=True)

    insumo = relationship("InsumoInventario", back_populates="movimientos")


class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(String, primary_key=True, index=True)
    fecha = Column(String, default=lambda: datetime.date.today().isoformat())
    tipo = Column(String, index=True) # INGRESO o EGRESO
    cuenta = Column(String, index=True) # NU MINA, NU EMI, MERCADO PAGO, EFECTIVO, NU TDC, PLATA TDC
    monto = Column(Float, default=0.0)
    detalle = Column(String)
    pedido_id = Column(String, nullable=True)
    es_egreso_pedido = Column(Boolean, default=False)
    categoria = Column(String, default="Otros")
    nota = Column(String, default="")


class Recoleccion(Base):
    __tablename__ = "recolecciones"

    id = Column(String, primary_key=True, index=True) # REC-001
    fecha = Column(String, default=lambda: datetime.date.today().isoformat())
    cuenta = Column(String, index=True) # Cuenta de pago
    gasto_gasolina = Column(Float, default=0.0)
    gasto_desayuno = Column(Float, default=0.0)
    gasto_otros = Column(Float, default=0.0)
    total_gasto = Column(Float, default=0.0)
    num_pedidos = Column(Integer, default=1)
    porcion_por_pedido = Column(Float, default=0.0)
    nota = Column(String, default="")

    pedidos = relationship("RecoleccionPedido", back_populates="recoleccion", cascade="all, delete-orphan")


class RecoleccionPedido(Base):
    __tablename__ = "recoleccion_pedidos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recoleccion_id = Column(String, ForeignKey("recolecciones.id"), index=True)
    pedido_id = Column(String, ForeignKey("pedidos.id"), index=True)
    porcion = Column(Float, default=0.0)
    fecha = Column(String, default=lambda: datetime.date.today().isoformat())

    recoleccion = relationship("Recoleccion", back_populates="pedidos")


class MaterialCalculadora(Base):
    __tablename__ = "materiales_calculadora"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String)
    proveedor = Column(String, default="Propio")
    ancho = Column(Float, default=100.0)
    alto = Column(Float, default=100.0)
    costo = Column(Float, default=0.0)


class ProductoCatalogo(Base):
    __tablename__ = "productos_catalogo"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String, unique=True)
    proveedor = Column(String, default="Propio")
    costo = Column(Float, default=0.0)
    margen = Column(Float, default=0.0)
    precio = Column(Float, default=0.0)
    insumos_json = Column(Text, default="[]") # JSON con los insumos predeterminados


class FacturaCFDI(Base):
    __tablename__ = "facturas_cfdi"

    id = Column(String, primary_key=True, index=True) # UUID o FAC-timestamp
    tipo = Column(String, index=True) # EMITIDA (Ingreso) o RECIBIDA (Gasto)
    uuid = Column(String, index=True, default="")
    serie = Column(String, default="")
    folio = Column(String, default="")
    fecha = Column(String, default=lambda: datetime.date.today().isoformat(), index=True)
    rfc_emisor = Column(String, default="")
    nombre_emisor = Column(String, default="")
    rfc_receptor = Column(String, default="")
    nombre_receptor = Column(String, default="")
    uso_cfdi = Column(String, default="")
    metodo_pago = Column(String, default="PUE") # PUE o PPD
    forma_pago = Column(String, default="03") # 01 Efectivo, 03 Transferencia, 04 Tarjeta, 28 Debito
    moneda = Column(String, default="MXN")
    
    subtotal = Column(Float, default=0.0)
    descuento = Column(Float, default=0.0)
    iva_trasladado = Column(Float, default=0.0) # IVA 16%
    iva_retenido = Column(Float, default=0.0) # Retención IVA
    isr_retenido = Column(Float, default=0.0) # Retención ISR 1.25%
    total = Column(Float, default=0.0)

    categoria = Column(String, default="Insumos") # Insumos, Gasolina, Alimentos, Servicios, Otros
    descripcion = Column(String, default="")
    archivo_nombre = Column(String, default="")
    es_deducible_iva = Column(Boolean, default=True)
    porcentaje_deducible = Column(Float, default=100.0) # 8.5 para Alimentos, 100 para Insumos
    comentario_contador = Column(Text, default="")

