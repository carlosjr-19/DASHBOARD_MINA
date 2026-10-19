from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from typing import Optional, List, Dict, Any
from ..database import get_db, engine
from ..models import all_models as models
from ..schemas import all_schemas as schemas
import datetime

router = APIRouter(prefix="/finanzas", tags=["finanzas"])

CUENTAS_DEF = ["NU MINA", "NU EMI", "MERCADO PAGO", "EFECTIVO", "NU TDC", "PLATA TDC"]

# Ensure new columns and tables exist in SQLite safely
def init_finanzas_db():
    try:
        models.Base.metadata.create_all(bind=engine)
        # inspect() funciona igual en SQLite y PostgreSQL
        col_names = [c["name"] for c in inspect(engine).get_columns("movimientos_caja")]
        with engine.connect() as conn:
            if "categoria" not in col_names:
                conn.exec_driver_sql("ALTER TABLE movimientos_caja ADD COLUMN categoria VARCHAR DEFAULT 'Otros'")
            if "nota" not in col_names:
                conn.exec_driver_sql("ALTER TABLE movimientos_caja ADD COLUMN nota VARCHAR DEFAULT ''")
            conn.commit()
    except Exception as e:
        print("Finanzas DB migration warning:", e)

init_finanzas_db()

@router.get("/movimientos")
def listar_movimientos(db: Session = Depends(get_db)):
    movs = db.query(models.MovimientoCaja).order_by(models.MovimientoCaja.fecha.desc()).all()
    
    pedidos_cache = {}
    resultado = []
    insumos_agrupados = {}

    for m in movs:
        # Si es un egreso automático de insumo ligado a un pedido
        if m.tipo == "EGRESO" and m.pedido_id and getattr(m, "es_egreso_pedido", False):
            key = (m.pedido_id, m.cuenta)
            if key not in insumos_agrupados:
                if m.pedido_id not in pedidos_cache:
                    pedidos_cache[m.pedido_id] = db.query(models.Pedido).filter(models.Pedido.id == m.pedido_id).first()
                ped = pedidos_cache[m.pedido_id]
                cliente_nom = ped.cliente if ped else "Cliente"

                # Obtener desglose de insumos y mermas de este pedido que se pagaron con esta cuenta
                desglose = []
                if ped:
                    for prod in ped.productos:
                        for ins in prod.insumos:
                            if ins.metodo_pago == m.cuenta:
                                cant_i = float(getattr(ins, 'cant', 1.0) or 1.0)
                                cu_i = float(getattr(ins, 'costo_unitario', 0.0) or 0.0)
                                c_i = float(getattr(ins, 'costo', 0.0) or (cant_i * cu_i))
                                desglose.append({
                                    "insumo": ins.nombre,
                                    "nombre": ins.nombre,
                                    "producto": prod.nombre,
                                    "proveedor": ins.proveedor or "Propio",
                                    "costoReal": cu_i,
                                    "cant": cant_i,
                                    "costoTotal": c_i
                                })
                        for mer in prod.mermas:
                            if getattr(mer, 'metodo_pago', 'STOCK') == m.cuenta:
                                cant_m = float(getattr(mer, 'cant', 1.0) or 1.0)
                                cu_m = float(getattr(mer, 'costo_unitario', 0.0) or 0.0)
                                c_m = cant_m * cu_m
                                desglose.append({
                                    "insumo": f"[Merma] {mer.material}",
                                    "nombre": f"[Merma] {mer.material}",
                                    "producto": prod.nombre,
                                    "proveedor": "Propio",
                                    "costoReal": cu_m,
                                    "cant": cant_m,
                                    "costoTotal": c_m
                                })

                insumos_agrupados[key] = {
                    "id": f"GRP-{m.pedido_id}-{m.cuenta.replace(' ', '_')}",
                    "idsOriginales": [m.id],
                    "fecha": m.fecha,
                    "tipo": "EGRESO",
                    "cuenta": m.cuenta,
                    "monto": m.monto,
                    "motivo": f"Insumos | {m.pedido_id} | {cliente_nom}" if cliente_nom else f"Insumos | {m.pedido_id}",
                    "detalle": f"Insumos | {m.pedido_id} | {cliente_nom}" if cliente_nom else f"Insumos | {m.pedido_id}",
                    "categoria": "Insumos",
                    "nota": getattr(m, 'nota', '') or '',
                    "pedidoId": m.pedido_id,
                    "esGrupoInsumos": True,
                    "insumos": desglose
                }
            else:
                insumos_agrupados[key]["idsOriginales"].append(m.id)
                insumos_agrupados[key]["monto"] += m.monto
        else:
            cat = getattr(m, 'categoria', None) or ("Cobro Pedido" if m.pedido_id and m.tipo == "INGRESO" else "Otros")
            resultado.append({
                "id": m.id,
                "fecha": m.fecha,
                "tipo": m.tipo,
                "cuenta": m.cuenta,
                "monto": m.monto,
                "motivo": m.detalle,
                "detalle": m.detalle,
                "categoria": cat,
                "nota": getattr(m, 'nota', '') or '',
                "pedidoId": m.pedido_id,
                "esGrupoInsumos": False,
                "insumos": []
            })

    # Añadir los grupos consolidados
    for grp in insumos_agrupados.values():
        resultado.append(grp)

    # Ordenar cronológicamente descendente
    resultado.sort(key=lambda x: x.get("fecha") or "", reverse=True)
    return resultado

@router.post("/movimientos")
def registrar_movimiento(m: schemas.MovimientoCajaSchema, db: Session = Depends(get_db)):
    mov_id = m.id or f"mov-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    mov = models.MovimientoCaja(
        id=mov_id,
        fecha=m.fecha or datetime.date.today().isoformat(),
        tipo=m.tipo,
        cuenta=m.cuenta,
        monto=m.monto,
        detalle=m.detalle,
        pedido_id=m.pedidoId,
        categoria=m.categoria or "Otros",
        nota=m.nota or ""
    )
    db.add(mov)

    # Si es abono a pedido, actualizar pedido y saldo deudor del cliente
    if m.pedidoId and m.tipo == "INGRESO":
        ped = db.query(models.Pedido).filter(models.Pedido.id == m.pedidoId).first()
        if ped:
            ped.pagado = (ped.pagado or 0.0) + m.monto
            if ped.cliente:
                cl = db.query(models.Cliente).filter(models.Cliente.nombre == ped.cliente).first()
                if cl:
                    cl.deuda = max(0.0, (cl.deuda or 0.0) - m.monto)

    db.commit()
    return {"status": "success", "id": mov_id}

@router.delete("/movimientos/{mov_id}")
def eliminar_movimiento(mov_id: str, db: Session = Depends(get_db)):
    # Si es un grupo unificado, eliminar todos los registros originales del grupo
    if mov_id.startswith("GRP-"):
        parts = mov_id.split("-")
        if len(parts) >= 3:
            ped_id = parts[1]
            cta = parts[2].replace("_", " ")
            db.query(models.MovimientoCaja).filter(
                models.MovimientoCaja.pedido_id == ped_id,
                models.MovimientoCaja.cuenta == cta,
                models.MovimientoCaja.es_egreso_pedido == True
            ).delete()
            db.commit()
            return {"status": "success", "id": mov_id}

    mov = db.query(models.MovimientoCaja).filter(models.MovimientoCaja.id == mov_id).first()
    if not mov:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    db.delete(mov)
    db.commit()
    return {"status": "success", "id": mov_id}

@router.get("/saldos")
def obtener_saldos(db: Session = Depends(get_db)):
    movs = db.query(models.MovimientoCaja).all()
    saldos = {c: 0.0 for c in CUENTAS_DEF}
    for m in movs:
        if m.cuenta in saldos:
            if m.tipo == "INGRESO":
                saldos[m.cuenta] += m.monto
            elif m.tipo == "EGRESO":
                saldos[m.cuenta] -= m.monto
    return saldos

# --- ENDPOINTS DE RECOLECCIONES ---

@router.get("/recolecciones")
def listar_recolecciones(db: Session = Depends(get_db)):
    recs = db.query(models.Recoleccion).order_by(models.Recoleccion.fecha.desc()).all()
    resultado = []
    for r in recs:
        peds = []
        for rp in r.pedidos:
            ped_obj = db.query(models.Pedido).filter(models.Pedido.id == rp.pedido_id).first()
            peds.append({
                "pedidoId": rp.pedido_id,
                "cliente": ped_obj.cliente if ped_obj else "",
                "porcion": rp.porcion,
                "fecha": rp.fecha
            })

        resultado.append({
            "id": r.id,
            "fecha": r.fecha,
            "cuenta": r.cuenta,
            "gastoGasolina": r.gasto_gasolina,
            "gastoDesayuno": r.gasto_desayuno,
            "gastoOtros": r.gasto_otros,
            "totalGasto": r.total_gasto,
            "numPedidos": r.num_pedidos,
            "porcionPorPedido": r.porcion_por_pedido,
            "nota": r.nota or "",
            "pedidos": peds
        })
    return resultado

@router.post("/recolecciones")
def registrar_recoleccion(data: schemas.RecoleccionSchema, db: Session = Depends(get_db)):
    existing = db.query(models.Recoleccion).all()
    nums = []
    for r in existing:
        try:
            nums.append(int(r.id.split("-")[1]))
        except Exception:
            pass
    next_num = max(nums) + 1 if nums else (len(existing) + 1)
    rec_id = f"REC-{str(next_num).zfill(3)}"

    pedidos_ids = data.pedidosIds or []
    total_gasto = float(data.totalGasto or (data.gastoGasolina + data.gastoDesayuno + data.gastoOtros))
    
    # Reparto proporcional o equitativo
    reparto_items = data.reparto or []
    if not reparto_items and pedidos_ids:
        num_peds = max(1, len(pedidos_ids))
        p_eq = round(total_gasto / num_peds, 2)
        reparto_items = [{"pedidoId": pid, "porcion": p_eq} for pid in pedidos_ids]

    num_peds = len(reparto_items) or 1
    promedio_porcion = round(total_gasto / num_peds, 2) if num_peds > 0 else total_gasto

    cuenta_principal = data.cuentaGasolina or data.cuenta or "NU MINA"

    rec = models.Recoleccion(
        id=rec_id,
        fecha=data.fecha or datetime.date.today().isoformat(),
        cuenta=cuenta_principal,
        gasto_gasolina=data.gastoGasolina,
        gasto_desayuno=data.gastoDesayuno,
        gasto_otros=data.gastoOtros,
        total_gasto=total_gasto,
        num_pedidos=num_peds,
        porcion_por_pedido=promedio_porcion,
        nota=data.nota or ""
    )
    db.add(rec)
    db.flush()

    for item in reparto_items:
        pid = item.pedidoId if hasattr(item, "pedidoId") else item.get("pedidoId")
        porc = item.porcion if hasattr(item, "porcion") else item.get("porcion", promedio_porcion)
        rp = models.RecoleccionPedido(
            recoleccion_id=rec_id,
            pedido_id=pid,
            porcion=float(porc),
            fecha=rec.fecha
        )
        db.add(rp)

    # Registrar egresos separados por cuenta para cuadrar reembolsos y tarjetas
    cta_gas = data.cuentaGasolina or data.cuenta or "NU TDC"
    cta_des = data.cuentaDesayuno or data.cuenta or "EFECTIVO"
    cta_otr = data.cuentaOtros or data.cuenta or "NU EMI"

    if data.gastoGasolina > 0:
        mov_gas = models.MovimientoCaja(
            id=f"EGR-{rec_id}-GAS",
            fecha=rec.fecha,
            tipo="EGRESO",
            cuenta=cta_gas,
            monto=data.gastoGasolina,
            detalle=f"Recolección {rec_id} | Gasolina",
            pedido_id=None,
            es_egreso_pedido=False,
            categoria="Gasolina",
            nota=data.nota or ""
        )
        db.add(mov_gas)

    if data.gastoDesayuno > 0:
        mov_des = models.MovimientoCaja(
            id=f"EGR-{rec_id}-DES",
            fecha=rec.fecha,
            tipo="EGRESO",
            cuenta=cta_des,
            monto=data.gastoDesayuno,
            detalle=f"Recolección {rec_id} | Alimentos",
            pedido_id=None,
            es_egreso_pedido=False,
            categoria="Alimentos",
            nota=data.nota or ""
        )
        db.add(mov_des)

    if data.gastoOtros > 0:
        mov_otr = models.MovimientoCaja(
            id=f"EGR-{rec_id}-OTR",
            fecha=rec.fecha,
            tipo="EGRESO",
            cuenta=cta_otr,
            monto=data.gastoOtros,
            detalle=f"Recolección {rec_id} | Otros",
            pedido_id=None,
            es_egreso_pedido=False,
            categoria="Otros",
            nota=data.nota or ""
        )
        db.add(mov_otr)

    db.commit()
    return {"status": "success", "id": rec_id, "numPedidos": num_peds}

@router.delete("/recolecciones/{rec_id}")
def eliminar_recoleccion(rec_id: str, db: Session = Depends(get_db)):
    rec = db.query(models.Recoleccion).filter(models.Recoleccion.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recolección no encontrada")
    db.query(models.MovimientoCaja).filter(models.MovimientoCaja.id.like(f"EGR-{rec_id}%")).delete(synchronize_session=False)
    db.delete(rec)
    db.commit()
    return {"status": "success", "id": rec_id}


# ==========================================
# --- CONTABILIDAD RESICO & FACTURAS CFDI ---
# ==========================================
import xml.etree.ElementTree as ET

# Tabla Mensual RESICO Personas Físicas (LISR Art. 113-E)
TABLA_RESICO_MENSUAL = [
    (25000.00, 0.0100),     # Hasta $25,000 -> 1.0%
    (50000.00, 0.0110),     # Hasta $50,000 -> 1.1%
    (83333.33, 0.0150),     # Hasta $83,333.33 -> 1.5%
    (208333.33, 0.0200),    # Hasta $208,333.33 -> 2.0%
    (3500000.00, 0.0250)    # Más de $208,333.33 -> 2.5%
]

def calcular_tasa_resico(ingresos_del_mes: float):
    if ingresos_del_mes <= 0:
        return 0.0100, 0.0
    for tope, tasa in TABLA_RESICO_MENSUAL:
        if ingresos_del_mes <= tope:
            return tasa, round(ingresos_del_mes * tasa, 2)
    return 0.0250, round(ingresos_del_mes * 0.0250, 2)


def parse_cfdi_xml_content(xml_text: str, default_tipo: str = "AUTO"):
    root = ET.fromstring(xml_text.strip())

    def get_attr(elem, attr, default=""):
        return elem.attrib.get(attr, default) if elem is not None else default

    subtotal = float(get_attr(root, "SubTotal", "0") or "0")
    total = float(get_attr(root, "Total", "0") or "0")
    descuento = float(get_attr(root, "Descuento", "0") or "0")
    moneda = get_attr(root, "Moneda", "MXN")
    serie = get_attr(root, "Serie", "")
    folio = get_attr(root, "Folio", "")
    fecha_raw = get_attr(root, "Fecha", "")
    fecha = fecha_raw.split("T")[0] if "T" in fecha_raw else fecha_raw[:10]
    forma_pago = get_attr(root, "FormaPago", "03")
    metodo_pago = get_attr(root, "MetodoPago", "PUE")

    rfc_emisor, nombre_emisor = "", ""
    rfc_receptor, nombre_receptor = "", ""
    uso_cfdi = ""

    for child in root:
        tag = child.tag.split("}")[-1]
        if tag == "Emisor":
            rfc_emisor = get_attr(child, "Rfc", "")
            nombre_emisor = get_attr(child, "Nombre", "")
        elif tag == "Receptor":
            rfc_receptor = get_attr(child, "Rfc", "")
            nombre_receptor = get_attr(child, "Nombre", "")
            uso_cfdi = get_attr(child, "UsoCFDI", "")

    uuid = ""
    for elem in root.iter():
        tag = elem.tag.split("}")[-1]
        if tag == "TimbreFiscalDigital":
            uuid = get_attr(elem, "UUID", "")

    iva_trasladado = 0.0
    iva_retenido = 0.0
    isr_retenido = 0.0
    conceptos_text = []

    for elem in root.iter():
        tag = elem.tag.split("}")[-1]
        if tag == "Concepto":
            desc = get_attr(elem, "Descripcion", "")
            if desc:
                conceptos_text.append(desc)
        elif tag == "Traslado":
            impuesto = get_attr(elem, "Impuesto", "")
            importe = float(get_attr(elem, "Importe", "0") or "0")
            if impuesto in ["002", "IVA", "02"]:
                iva_trasladado += importe
        elif tag == "Retencion":
            impuesto = get_attr(elem, "Impuesto", "")
            importe = float(get_attr(elem, "Importe", "0") or "0")
            if impuesto in ["001", "ISR", "01"]:
                isr_retenido += importe
            elif impuesto in ["002", "IVA", "02"]:
                iva_retenido += importe

    descripcion = " | ".join(conceptos_text[:3]) if conceptos_text else "Factura CFDI"

    categoria = "Insumos"
    desc_lower = descripcion.lower()
    if any(k in desc_lower for k in ["gasolina", "combustible", "magna", "premium", "diesel", "estacion"]):
        categoria = "Gasolina"
    elif any(k in desc_lower for k in ["alimento", "restaurante", "consumo", "comida", "cafe", "desayuno", "cena"]):
        categoria = "Alimentos"
    elif any(k in desc_lower for k in ["luz", "cfe", "internet", "telefonia", "telmex", "totalplay", "servicio"]):
        categoria = "Servicios"
    elif any(k in desc_lower for k in ["lona", "vinil", "dtf", "tinta", "papel", "acrilico", "gorra", "playera", "rollo", "impresion", "maquila"]):
        categoria = "Insumos"

    tipo = default_tipo
    if tipo == "AUTO" or not tipo:
        rfc_e_clean = (rfc_emisor or "").upper().strip()
        rfc_r_clean = (rfc_receptor or "").upper().strip()
        nom_e_clean = (nombre_emisor or "").upper()
        nom_r_clean = (nombre_receptor or "").upper()

        if rfc_e_clean.startswith("VIHN") or "VILLARROEL" in nom_e_clean or "MINA" in nom_e_clean:
            tipo = "EMITIDA"
        elif rfc_r_clean.startswith("VIHN") or "VILLARROEL" in nom_r_clean or "MINA" in nom_r_clean:
            tipo = "RECIBIDA"
        else:
            tipo = "RECIBIDA"

    porcentaje_deducible = 100.0
    es_deducible = True
    comentario = ""

    if tipo == "RECIBIDA":
        if categoria == "Alimentos":
            porcentaje_deducible = 8.5
            comentario = "⚖️ RESICO (LISR Art. 28 Fracc. XX): Consumo en restaurantes dentro de 50 km sólo permite acreditar el 8.5% de IVA si se pagó con tarjeta/transferencia. Si fue viaje de trabajo comprobado fuera de 50 km con hospedaje, aplica al 100% como viático."
        elif categoria == "Gasolina":
            if forma_pago == "01":
                es_deducible = False
                porcentaje_deducible = 0.0
                comentario = "🚨 ALERTA SAT (Art. 27 Fracc. III LISR): La gasolina pagada en EFECTIVO NO es acreditable para IVA ni deducible, sin importar el monto. Debe pagarse siempre con tarjeta, transferencia o monedero electrónico."
            else:
                comentario = "✅ Gasolina 100% acreditable para IVA pagada con medio bancario autorizado."
        elif categoria == "Insumos":
            comentario = "✅ Insumo indispensable para tu taller gráfico: 100% acreditable para IVA."
        else:
            comentario = "✅ Gasto con CFDI para acreditar IVA en tu declaración mensual."
    else:
        if isr_retenido > 0:
            comentario = f"📌 Retención de ISR 1.25% (${isr_retenido:.2f}): Retenido por Persona Moral. Se resta directamente a tu favor contra el ISR a pagar en tu declaración mensual."
        else:
            comentario = "📌 Factura emitida a cliente. Genera IVA trasladado (16%) y acumula base para el cálculo de ISR RESICO."

    return {
        "uuid": uuid,
        "serie": serie,
        "folio": folio,
        "fecha": fecha,
        "rfcEmisor": rfc_emisor,
        "nombreEmisor": nombre_emisor,
        "rfcReceptor": rfc_receptor,
        "nombreReceptor": nombre_receptor,
        "usoCfdi": uso_cfdi,
        "metodoPago": metodo_pago,
        "formaPago": forma_pago,
        "moneda": moneda,
        "subtotal": round(subtotal, 2),
        "descuento": round(descuento, 2),
        "ivaTrasladado": round(iva_trasladado, 2),
        "ivaRetenido": round(iva_retenido, 2),
        "isrRetenido": round(isr_retenido, 2),
        "total": round(total, 2),
        "categoria": categoria,
        "descripcion": descripcion[:250],
        "tipo": tipo,
        "esDeducibleIva": es_deducible,
        "porcentajeDeducible": porcentaje_deducible,
        "comentarioContador": comentario
    }


@router.get("/facturas")
def listar_facturas(tipo: Optional[str] = None, year: Optional[int] = None, month: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.FacturaCFDI)
    if tipo:
        query = query.filter(models.FacturaCFDI.tipo == tipo.upper())
    
    facturas = query.order_by(models.FacturaCFDI.fecha.desc()).all()
    resultado = []
    for f in facturas:
        if year or month:
            try:
                dt = datetime.datetime.strptime(f.fecha, "%Y-%m-%d")
                if year and dt.year != year:
                    continue
                if month and dt.month != month:
                    continue
            except:
                pass

        resultado.append({
            "id": f.id,
            "tipo": f.tipo,
            "uuid": f.uuid,
            "serie": f.serie,
            "folio": f.folio,
            "fecha": f.fecha,
            "rfcEmisor": f.rfc_emisor,
            "nombreEmisor": f.nombre_emisor,
            "rfcReceptor": f.rfc_receptor,
            "nombreReceptor": f.nombre_receptor,
            "usoCfdi": f.uso_cfdi,
            "metodoPago": f.metodo_pago,
            "formaPago": f.forma_pago,
            "moneda": f.moneda,
            "subtotal": f.subtotal,
            "descuento": f.descuento,
            "ivaTrasladado": f.iva_trasladado,
            "ivaRetenido": f.iva_retenido,
            "isrRetenido": f.isr_retenido,
            "total": f.total,
            "categoria": f.categoria,
            "descripcion": f.descripcion,
            "archivoNombre": f.archivo_nombre,
            "esDeducibleIva": f.es_deducible_iva,
            "porcentajeDeducible": f.porcentaje_deducible,
            "comentarioContador": f.comentario_contador
        })
    return resultado


@router.post("/facturas")
def guardar_factura_manual(data: schemas.FacturaCFDISchema, db: Session = Depends(get_db)):
    fac_id = data.id or data.uuid or f"FAC-{int(datetime.datetime.now().timestamp() * 1000)}"
    
    # Comentario y deducibilidad automática si no viene especificado
    pct = data.porcentajeDeducible if data.porcentajeDeducible is not None else 100.0
    es_ded = data.esDeducibleIva if data.esDeducibleIva is not None else True
    coment = data.comentarioContador or ""

    if data.tipo == "RECIBIDA":
        if data.categoria == "Alimentos" and not coment:
            pct = 8.5
            coment = "⚖️ RESICO (LISR Art. 28 Fracc. XX): Consumo en restaurantes permite acreditar máx 8.5% de IVA pagando con tarjeta o transferencia."
        elif data.categoria == "Gasolina" and data.formaPago == "01":
            es_ded = False
            pct = 0.0
            coment = "🚨 ALERTA SAT: Gasolina pagada en efectivo NO permite acreditar IVA ni deducir."

    nueva = models.FacturaCFDI(
        id=fac_id,
        tipo=data.tipo.upper(),
        uuid=data.uuid or fac_id,
        serie=data.serie or "",
        folio=data.folio or "",
        fecha=data.fecha or datetime.date.today().isoformat(),
        rfc_emisor=data.rfcEmisor or "",
        nombre_emisor=data.nombreEmisor or "",
        rfc_receptor=data.rfcReceptor or "",
        nombre_receptor=data.nombreReceptor or "",
        uso_cfdi=data.usoCfdi or "",
        metodo_pago=data.metodoPago or "PUE",
        forma_pago=data.formaPago or "03",
        moneda=data.moneda or "MXN",
        subtotal=float(data.subtotal or 0.0),
        descuento=float(data.descuento or 0.0),
        iva_trasladado=float(data.ivaTrasladado or 0.0),
        iva_retenido=float(data.ivaRetenido or 0.0),
        isr_retenido=float(data.isrRetenido or 0.0),
        total=float(data.total or 0.0),
        categoria=data.categoria or "Insumos",
        descripcion=data.descripcion or "",
        archivo_nombre=data.archivoNombre or "",
        es_deducible_iva=es_ded,
        porcentaje_deducible=pct,
        comentario_contador=coment
    )
    db.merge(nueva)
    db.commit()
    return {"status": "success", "id": fac_id}


@router.post("/facturas/upload-xml")
def subir_y_parsear_xml(data: schemas.FacturaXMLUploadSchema, db: Session = Depends(get_db)):
    try:
        parsed = parse_cfdi_xml_content(data.xmlContent, default_tipo=data.tipo or "AUTO")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar el archivo XML del CFDI: {str(e)}")

    fac_id = parsed["uuid"] or f"CFDI-{int(datetime.datetime.now().timestamp() * 1000)}"

    factura = models.FacturaCFDI(
        id=fac_id,
        tipo=parsed["tipo"],
        uuid=parsed["uuid"] or fac_id,
        serie=parsed["serie"],
        folio=parsed["folio"],
        fecha=parsed["fecha"],
        rfc_emisor=parsed["rfcEmisor"],
        nombre_emisor=parsed["nombreEmisor"],
        rfc_receptor=parsed["rfcReceptor"],
        nombre_receptor=parsed["nombreReceptor"],
        uso_cfdi=parsed["usoCfdi"],
        metodo_pago=parsed["metodoPago"],
        forma_pago=parsed["formaPago"],
        moneda=parsed["moneda"],
        subtotal=parsed["subtotal"],
        descuento=parsed["descuento"],
        iva_trasladado=parsed["ivaTrasladado"],
        iva_retenido=parsed["ivaRetenido"],
        isr_retenido=parsed["isrRetenido"],
        total=parsed["total"],
        categoria=parsed["categoria"],
        descripcion=parsed["descripcion"],
        archivo_nombre=data.archivoNombre or "factura.xml",
        es_deducible_iva=parsed["esDeducibleIva"],
        porcentaje_deducible=parsed["porcentajeDeducible"],
        comentario_contador=parsed["comentarioContador"]
    )
    db.merge(factura)
    db.commit()

    try:
        dt = datetime.datetime.strptime(parsed["fecha"][:10], "%Y-%m-%d")
        fac_year = dt.year
        fac_month = dt.month
    except:
        fac_year = datetime.date.today().year
        fac_month = datetime.date.today().month

    return {
        "status": "success", 
        "factura": parsed, 
        "id": fac_id,
        "year": fac_year,
        "month": fac_month
    }


@router.delete("/facturas/{factura_id}")
def eliminar_factura(factura_id: str, db: Session = Depends(get_db)):
    fac = db.query(models.FacturaCFDI).filter(models.FacturaCFDI.id == factura_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    db.delete(fac)
    db.commit()
    return {"status": "success", "id": factura_id}


@router.get("/resico/resumen")
def resumen_resico_mensual(year: Optional[int] = None, month: Optional[int] = None, db: Session = Depends(get_db)):
    current_year = year or datetime.date.today().year
    current_month = month or datetime.date.today().month

    meses_nombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    meses_completos = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

    # Inicializar comparativa anual mes a mes
    comparativa_meses = []
    for m in range(1, 13):
        comparativa_meses.append({
            "mes": m,
            "mesNombre": meses_nombres[m - 1],
            "mesCompleto": meses_completos[m - 1],
            "ventas": 0.0,
            "gastos": 0.0,
            "gananciaNeta": 0.0,
            "ivaTrasladado": 0.0,
            "ivaAcreditable": 0.0,
            "numEmitidas": 0,
            "numRecibidas": 0
        })

    # Cargar todas las facturas del año
    facturas_todas = db.query(models.FacturaCFDI).all()
    has_facturas = len(facturas_todas) > 0

    facturas_mes_activo = []

    for f in facturas_todas:
        try:
            dt = datetime.datetime.strptime(f.fecha[:10], "%Y-%m-%d")
        except:
            continue
        
        if dt.year == current_year:
            idx = dt.month - 1
            if f.tipo == "EMITIDA":
                comparativa_meses[idx]["ventas"] += f.subtotal
                comparativa_meses[idx]["ivaTrasladado"] += f.iva_trasladado
                comparativa_meses[idx]["numEmitidas"] += 1
            else:
                comparativa_meses[idx]["gastos"] += f.subtotal
                pct = (f.porcentaje_deducible or 100.0) / 100.0 if f.es_deducible_iva else 0.0
                comparativa_meses[idx]["ivaAcreditable"] += (f.iva_trasladado * pct)
                comparativa_meses[idx]["numRecibidas"] += 1

        if dt.year == current_year and dt.month == current_month:
            facturas_mes_activo.append(f)

    # Cálculo mensual estricto basado únicamente en Comprobantes Fiscales CFDI (Facturas Emitidas vs Facturas Recibidas)
    for item in comparativa_meses:
        item["ventas"] = round(item["ventas"], 2)
        item["gastos"] = round(item["gastos"], 2)
        item["gananciaNeta"] = round(item["ventas"] - item["gastos"], 2)
        item["ivaTrasladado"] = round(item["ivaTrasladado"], 2)
        item["ivaAcreditable"] = round(item["ivaAcreditable"], 2)

    # --- CALCULO FISCAL DETALLADO DEL MES SELECCIONADO ---
    mes_data = comparativa_meses[current_month - 1]
    ventas_mes = mes_data["ventas"]
    gastos_mes = mes_data["gastos"]
    ganancia_neta_mes = mes_data["gananciaNeta"]

    # Sumar retenciones reales registradas en facturas del mes
    ret_isr_mes = sum(f.isr_retenido for f in facturas_mes_activo if f.tipo == "EMITIDA")
    ret_iva_mes = sum(f.iva_retenido for f in facturas_mes_activo if f.tipo == "EMITIDA")

    # 1. CÁLCULO DE ISR RESICO
    tasa_resico, isr_determinado = calcular_tasa_resico(ventas_mes)
    isr_neto_pagar = max(0.0, round(isr_determinado - ret_isr_mes, 2))
    isr_saldo_favor = max(0.0, round(ret_isr_mes - isr_determinado, 2)) if ret_isr_mes > isr_determinado else 0.0

    # 2. CÁLCULO DE IVA RESICO
    iva_trasladado_mes = mes_data["ivaTrasladado"]
    iva_acreditable_mes = mes_data["ivaAcreditable"]
    iva_neto_pagar = max(0.0, round(iva_trasladado_mes - iva_acreditable_mes - ret_iva_mes, 2))
    iva_saldo_favor = max(0.0, round((iva_acreditable_mes + ret_iva_mes) - iva_trasladado_mes, 2)) if (iva_acreditable_mes + ret_iva_mes) > iva_trasladado_mes else 0.0

    # Desglose de Gastos por Categoría con análisis fiscal
    gastos_por_categoria = {}
    for f in facturas_mes_activo:
        if f.tipo == "RECIBIDA":
            cat = f.categoria or "Otros"
            if cat not in gastos_por_categoria:
                gastos_por_categoria[cat] = {"total": 0.0, "acreditable": 0.0, "ivaAcreditable": 0.0, "count": 0}
            gastos_por_categoria[cat]["total"] += f.subtotal
            pct = (f.porcentaje_deducible or 100.0) / 100.0 if f.es_deducible_iva else 0.0
            gastos_por_categoria[cat]["acreditable"] += (f.subtotal * pct)
            gastos_por_categoria[cat]["ivaAcreditable"] += (f.iva_trasladado * pct)
            gastos_por_categoria[cat]["count"] += 1

    consejos_contador = [
        {
            "tipo": "RESICO_REGLA_ORO",
            "titulo": "Regla de Oro en ISR RESICO (Personas Físicas)",
            "descripcion": "Tus compras y gastos NO restan la base gravable para el ISR. El SAT te otorga una tasa preferencial fija de entre 1.0% y 2.5% directa sobre tus ingresos brutos cobrados. No te preocupes por 'deducir para bajar el ISR', ¡esa tasa baja ya es tu beneficio!"
        },
        {
            "tipo": "IVA_ACREDITAMIENTO",
            "titulo": "Para el IVA tus gastos SÍ son indispensables",
            "descripcion": "Aunque en ISR no resten la base, tus compras de insumos y servicios con CFDI son 100% vitales para acreditar el IVA (16%). Cada peso de IVA pagado a tus proveedores resta directamente al IVA que cobraste a tus clientes, reduciendo lo que pagarás al SAT."
        },
        {
            "tipo": "ALIMENTOS",
            "titulo": "Alimentos y Consumo en Restaurantes (Art. 28 Fracc. XX LISR)",
            "descripcion": "Si vas a comer a un restaurante dentro de tu localidad (50 km), el SAT solo permite deducir/acreditar el 8.5% del consumo y requiere pago electrónico forzoso (tarjeta o transferencia). Si es un viaje fuera de los 50 km de tu domicilio fiscal, comprueba también hospedaje o transporte para que aplique al 100% como viático."
        },
        {
            "tipo": "GASOLINA",
            "titulo": "Gasolina y Combustibles (Art. 27 Fracc. III LISR)",
            "descripcion": "¡Cuidado extremo! La gasolina pagada en EFECTIVO es 0% deducible y 0% acreditable de IVA, sin importar si es de $50 o $1,000 pesos. Págala siempre con tarjeta de débito, crédito o monedero autorizado a nombre del contribuyente."
        },
        {
            "tipo": "RETENCION_PM",
            "titulo": "Retención de 1.25% de ISR por Personas Morales",
            "descripcion": "Cuando le emitas una factura a una empresa (S.A., S. de R.L., S.A.S.), ellos te retendrán el 1.25% de ISR. En tu declaración mensual resta ese importe a tu favor contra el ISR determinado."
        }
    ]

    return {
        "year": current_year,
        "month": current_month,
        "mesNombre": meses_completos[current_month - 1],
        "comparativaAnual": comparativa_meses,
        "hasFacturasRegistradas": has_facturas,
        "kpis": {
            "ventasFacturadas": round(ventas_mes, 2),
            "gastosFacturados": round(gastos_mes, 2),
            "gananciaNeta": round(ganancia_neta_mes, 2),
            "margenPorcentaje": round((ganancia_neta_mes / ventas_mes * 100.0), 1) if ventas_mes > 0 else 0.0,
            "totalImpuestosEstimados": round(isr_neto_pagar + iva_neto_pagar, 2)
        },
        "isrResico": {
            "baseGravable": round(ventas_mes, 2),
            "tasaPorcentaje": round(tasa_resico * 100.0, 2),
            "isrDeterminado": round(isr_determinado, 2),
            "retencionIsr": round(ret_isr_mes, 2),
            "isrNetoPagar": round(isr_neto_pagar, 2),
            "isrSaldoFavor": round(isr_saldo_favor, 2)
        },
        "ivaResico": {
            "ivaTrasladado": round(iva_trasladado_mes, 2),
            "ivaAcreditable": round(iva_acreditable_mes, 2),
            "retencionIva": round(ret_iva_mes, 2),
            "ivaNetoPagar": round(iva_neto_pagar, 2),
            "ivaSaldoFavor": round(iva_saldo_favor, 2)
        },
        "gastosCategorias": gastos_por_categoria,
        "numFacturasMes": len(facturas_mes_activo),
        "consejosContador": consejos_contador
    }


