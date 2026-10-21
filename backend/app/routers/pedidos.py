from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import all_models as models
from ..schemas import all_schemas as schemas
import datetime
import json

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

def init_pedidos_db():
    try:
        from sqlalchemy import inspect
        from ..database import engine
        models.Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        ped_cols = [c["name"] for c in inspector.get_columns("pedidos")]
        with engine.connect() as conn:
            if "metodo_pago_anticipo" not in ped_cols:
                conn.exec_driver_sql("ALTER TABLE pedidos ADD COLUMN metodo_pago_anticipo VARCHAR DEFAULT 'NU MINA'")
            ins_cols = [c["name"] for c in inspector.get_columns("pedido_insumos")]
            if "medida" not in ins_cols:
                conn.exec_driver_sql("ALTER TABLE pedido_insumos ADD COLUMN medida VARCHAR DEFAULT ''")
            conn.commit()
    except Exception as e:
        print("Pedidos DB migration warning:", e)

init_pedidos_db()


@router.get("")
def listar_pedidos(db: Session = Depends(get_db)):
    pedidos = db.query(models.Pedido).order_by(models.Pedido.id.desc()).all()
    resultado = []
    for p in pedidos:
        prods = []
        for prod in p.productos:
            insumos = [{
                "nombre": i.nombre, "detalle": i.detalle or "", "medida": getattr(i, "medida", "") or "", "nota": i.nota or "",
                "proveedor": i.proveedor, "metodoPago": i.metodo_pago,
                "cant": getattr(i, "cant", 1.0) or 1.0,
                "costoUnitario": getattr(i, "costo_unitario", 0.0) or (i.costo / (getattr(i, "cant", 1.0) or 1.0)),
                "costo": i.costo
            } for i in prod.insumos]
            
            mermas = [{
                "material": m.material, "cant": m.cant, "motivo": m.motivo, "costoUnitario": m.costo_unitario,
                "metodoPago": getattr(m, "metodo_pago", "STOCK") or "STOCK"
            } for m in prod.mermas]

            prods.append({
                "nombre": prod.nombre, "proveedor": prod.proveedor, "cant": prod.cant,
                "precioUnitario": prod.precio_unitario, "costoUnitario": prod.costo_unitario,
                "nota": getattr(prod, "nota", "") or "",
                "insumos": insumos, "mermas": mermas
            })

        # Recolecciones prorrateadas vinculadas a este pedido
        recs_pedido = db.query(models.RecoleccionPedido).filter(models.RecoleccionPedido.pedido_id == p.id).all()
        recolecciones_list = []
        costo_recoleccion_total = 0.0
        for rp in recs_pedido:
            rec_obj = db.query(models.Recoleccion).filter(models.Recoleccion.id == rp.recoleccion_id).first()
            conceptos = []
            if rec_obj:
                if rec_obj.gasto_gasolina > 0: conceptos.append(f"Gasolina: ${rec_obj.gasto_gasolina:.2f}")
                if rec_obj.gasto_desayuno > 0: conceptos.append(f"Alimentos: ${rec_obj.gasto_desayuno:.2f}")
                if rec_obj.gasto_otros > 0: conceptos.append(f"Otros: ${rec_obj.gasto_otros:.2f}")
            recolecciones_list.append({
                "recoleccionId": rp.recoleccion_id,
                "fecha": rp.fecha,
                "porcion": rp.porcion,
                "totalRecoleccion": rec_obj.total_gasto if rec_obj else rp.porcion,
                "numPedidos": rec_obj.num_pedidos if rec_obj else 1,
                "conceptos": ", ".join(conceptos),
                "nota": rec_obj.nota if rec_obj else ""
            })
            costo_recoleccion_total += rp.porcion

        costo_base = (p.costo_insumos or 0.0) + (p.costo_mermas or 0.0)
        costo_total_real = costo_base + costo_recoleccion_total
        ganancia_real = (p.total or 0.0) - costo_total_real

        resultado.append({
            "id": p.id,
            "tipo": p.tipo,
            "fecha": p.fecha,
            "cliente": p.cliente,
            "requiereFactura": p.requiere_factura,
            "tipoPersona": p.tipo_persona,
            "subtotal": p.subtotal,
            "iva": p.iva,
            "retencionIsr": p.retencion_isr,
            "total": p.total,
            "pagado": p.pagado,
            "metodoPagoAnticipo": getattr(p, "metodo_pago_anticipo", "NU MINA") or "NU MINA",
            "costoTotal": costo_base,
            "costoMermasTotal": p.costo_mermas,
            "ganancia": ganancia_real,
            "costoRecoleccion": costo_recoleccion_total,
            "costoTotalReal": costo_total_real,
            "gananciaReal": ganancia_real,
            "recolecciones": recolecciones_list,
            "estatus": p.estatus,
            "facturaEstatus": p.factura_estatus,
            "facturaFecha": p.factura_fecha,
            "facturaArchivoData": p.factura_archivo_data,
            "facturaArchivoNombre": p.factura_archivo_nombre,
            "fechaEntrega": p.fecha_entrega,
            "motivoCancelacion": p.motivo_cancelacion,
            "cotizacionOrigen": p.cotizacion_origen,
            "convertidaAPedido": p.convertida_a_pedido if (p.tipo == "COTIZACION" or p.id.startswith("CMD-")) else None,
            "productos": prods
        })
    return resultado

@router.post("")
def guardar_pedido(data: schemas.PedidoCreateSchema, db: Session = Depends(get_db)):
    pedido_existente = db.query(models.Pedido).filter(models.Pedido.id == data.id).first()
    
    if pedido_existente:
        # Actualizar campos
        pedido_existente.fecha = data.fecha or datetime.date.today().isoformat()
        pedido_existente.cliente = data.cliente
        pedido_existente.requiere_factura = data.requiereFactura
        pedido_existente.tipo_persona = data.tipoPersona
        pedido_existente.subtotal = data.subtotal
        pedido_existente.iva = data.iva
        pedido_existente.retencion_isr = data.retencionIsr
        pedido_existente.total = data.total
        pedido_existente.pagado = data.pagado
        pedido_existente.metodo_pago_anticipo = getattr(data, "metodoPagoAnticipo", "NU MINA") or "NU MINA"
        pedido_existente.costo_insumos = data.costoTotal
        pedido_existente.costo_mermas = data.costoMermasTotal
        pedido_existente.ganancia_neta = data.ganancia
        pedido_existente.estatus = data.estatus
        pedido_existente.factura_estatus = data.facturaEstatus or "-"
        pedido_existente.factura_fecha = data.facturaFecha
        pedido_existente.fecha_entrega = data.fechaEntrega
        pedido_existente.motivo_cancelacion = data.motivoCancelacion
        pedido_obj = pedido_existente
        
        # Limpiar insumos, mermas y productos previos para reconstruir sin duplicados
        prev_prod_ids = [p.id for p in db.query(models.PedidoProducto.id).filter(models.PedidoProducto.pedido_id == data.id).all()]
        if prev_prod_ids:
            db.query(models.PedidoInsumo).filter(models.PedidoInsumo.producto_id.in_(prev_prod_ids)).delete(synchronize_session=False)
            db.query(models.PedidoMerma).filter(models.PedidoMerma.producto_id.in_(prev_prod_ids)).delete(synchronize_session=False)
        db.query(models.PedidoInsumo).filter(models.PedidoInsumo.pedido_id == data.id).delete(synchronize_session=False)
        db.query(models.PedidoProducto).filter(models.PedidoProducto.pedido_id == data.id).delete(synchronize_session=False)
    else:
        pedido_obj = models.Pedido(
            id=data.id,
            tipo="COTIZACION" if data.id.startswith("CMD-") else "PEDIDO",
            fecha=data.fecha or datetime.date.today().isoformat(),
            cliente=data.cliente,
            requiere_factura=data.requiereFactura,
            tipo_persona=data.tipoPersona,
            subtotal=data.subtotal,
            iva=data.iva,
            retencion_isr=data.retencionIsr,
            total=data.total,
            pagado=data.pagado,
            metodo_pago_anticipo=getattr(data, "metodoPagoAnticipo", "NU MINA") or "NU MINA",
            costo_insumos=data.costoTotal,
            costo_mermas=data.costoMermasTotal,
            ganancia_neta=data.ganancia,
            estatus=data.estatus,
            factura_estatus=data.facturaEstatus or "-",
            factura_fecha=data.facturaFecha,
            fecha_entrega=data.fechaEntrega,
            motivo_cancelacion=data.motivoCancelacion,
            cotizacion_origen=data.cotizacionOrigen,
            convertida_a_pedido=data.convertidaAPedido
        )
        db.add(pedido_obj)
        db.flush()

    # Revertir movimientos de inventario y egresos previos si es un pedido existente
    if pedido_obj.tipo == "PEDIDO" or pedido_obj.id.startswith("PMD-"):
        prev_movs = db.query(models.MovimientoInventario).filter(models.MovimientoInventario.pedido_id == pedido_obj.id).all()
        for pm in prev_movs:
            inv = None
            if pm.insumo_id:
                inv = db.query(models.InsumoInventario).filter(models.InsumoInventario.id == pm.insumo_id).first()
            if not inv:
                inv = db.query(models.InsumoInventario).filter(models.InsumoInventario.nombre.ilike(pm.insumo_nombre)).first()
            if inv:
                inv.stock += pm.cant
            db.delete(pm)

        db.query(models.MovimientoCaja).filter(
            models.MovimientoCaja.pedido_id == pedido_obj.id,
            models.MovimientoCaja.es_egreso_pedido == True
        ).delete()

    # Guardar productos, insumos y mermas
    for prod_data in data.productos:
        prod_model = models.PedidoProducto(
            pedido_id=pedido_obj.id,
            nombre=prod_data.nombre,
            proveedor=prod_data.proveedor,
            cant=prod_data.cant,
            precio_unitario=prod_data.precioUnitario,
            costo_unitario=prod_data.costoUnitario,
            nota=prod_data.nota or ""
        )
        db.add(prod_model)
        db.flush()

        for ins_data in prod_data.insumos:
            ins_model = models.PedidoInsumo(
                producto_id=prod_model.id,
                pedido_id=pedido_obj.id,
                nombre=ins_data.nombre,
                detalle=ins_data.detalle,
                medida=getattr(ins_data, "medida", "") or "",
                nota=ins_data.nota,
                proveedor=ins_data.proveedor,
                metodo_pago=ins_data.metodoPago,
                cant=ins_data.cant,
                costo_unitario=ins_data.costoUnitario,
                costo=ins_data.costo
            )
            db.add(ins_model)
            db.flush()

            # Trazabilidad de inventario y egresos de caja para pedidos activos
            if pedido_obj.tipo == "PEDIDO" or pedido_obj.id.startswith("PMD-"):
                if ins_data.metodoPago == "STOCK":
                    inv = db.query(models.InsumoInventario).filter(
                        models.InsumoInventario.nombre.ilike(ins_data.nombre.strip())
                    ).first()
                    cant_consumo = float(ins_data.cant or 1.0)
                    if inv:
                        inv.stock = max(0.0, inv.stock - cant_consumo)
                        db.add(models.MovimientoInventario(
                            insumo_id=inv.id,
                            insumo_nombre=inv.nombre,
                            pedido_id=pedido_obj.id,
                            tipo="CONSUMO",
                            cant=cant_consumo,
                            fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                            motivo=f"Consumo en pedido {pedido_obj.id} ({prod_data.nombre})"
                        ))
                    else:
                        db.add(models.MovimientoInventario(
                            insumo_id=None,
                            insumo_nombre=ins_data.nombre.strip(),
                            pedido_id=pedido_obj.id,
                            tipo="CONSUMO",
                            cant=cant_consumo,
                            fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                            motivo=f"Consumo en pedido {pedido_obj.id} ({prod_data.nombre})"
                        ))
                elif ins_data.metodoPago and ins_data.metodoPago != "STOCK":
                    costo_ins = float(ins_data.costo or 0.0)
                    if costo_ins > 0:
                        db.add(models.MovimientoCaja(
                            id=f"EGR-{pedido_obj.id}-{prod_model.id}-{ins_model.id}",
                            fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                            tipo="EGRESO",
                            cuenta=ins_data.metodoPago,
                            monto=costo_ins,
                            detalle=f"Egreso por insumo '{ins_data.nombre}' del pedido {pedido_obj.id}",
                            pedido_id=pedido_obj.id,
                            es_egreso_pedido=True
                        ))

        for mer_data in prod_data.mermas:
            mer_metodo_pago = getattr(mer_data, "metodoPago", "STOCK") or "STOCK"
            cant_merma = float(mer_data.cant or 1.0)
            cu_merma = float(mer_data.costoUnitario or 0.0)
            costo_merma = cant_merma * cu_merma

            mer_model = models.PedidoMerma(
                producto_id=prod_model.id,
                material=mer_data.material,
                cant=cant_merma,
                motivo=mer_data.motivo,
                costo_unitario=cu_merma,
                metodo_pago=mer_metodo_pago
            )
            db.add(mer_model)
            db.flush()

            # Trazabilidad de merma en inventario o egresos de caja según metodo_pago
            if pedido_obj.tipo == "PEDIDO" or pedido_obj.id.startswith("PMD-"):
                if mer_metodo_pago == "STOCK":
                    inv_mer = db.query(models.InsumoInventario).filter(
                        models.InsumoInventario.nombre.ilike(mer_data.material.strip())
                    ).first()
                    if inv_mer:
                        inv_mer.stock = max(0.0, inv_mer.stock - cant_merma)
                        db.add(models.MovimientoInventario(
                            insumo_id=inv_mer.id,
                            insumo_nombre=inv_mer.nombre,
                            pedido_id=pedido_obj.id,
                            tipo="MERMA",
                            cant=cant_merma,
                            fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                            motivo=f"Merma en pedido {pedido_obj.id}: {mer_data.motivo or 'Desperdicio'}"
                        ))
                    else:
                        db.add(models.MovimientoInventario(
                            insumo_id=None,
                            insumo_nombre=mer_data.material.strip(),
                            pedido_id=pedido_obj.id,
                            tipo="MERMA",
                            cant=cant_merma,
                            fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                            motivo=f"Merma en pedido {pedido_obj.id}: {mer_data.motivo or 'Desperdicio'}"
                        ))
                elif mer_metodo_pago and mer_metodo_pago != "STOCK":
                    if costo_merma > 0:
                        db.add(models.MovimientoCaja(
                            id=f"EGR-MERMA-{pedido_obj.id}-{prod_model.id}-{mer_model.id}",
                            fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                            tipo="EGRESO",
                            cuenta=mer_metodo_pago,
                            monto=costo_merma,
                            detalle=f"Egreso por merma '{mer_data.material}' del pedido {pedido_obj.id}: {mer_data.motivo or 'Desperdicio'}",
                            pedido_id=pedido_obj.id,
                            es_egreso_pedido=True
                        ))

        # Auto-registro en Catálogo de Productos si tiene nombre
        if prod_data.nombre and prod_data.nombre.strip():
            nombre_limpio = prod_data.nombre.strip()
            cat_prod = db.query(models.ProductoCatalogo).filter(
                models.ProductoCatalogo.nombre.ilike(nombre_limpio)
            ).first()

            insumos_list = [{
                "nombre": i.nombre,
                "detalle": i.detalle or "",
                "nota": i.nota or "",
                "proveedor": i.proveedor or "",
                "metodoPago": i.metodoPago or "STOCK",
                "cant": float(i.cant or 1.0),
                "costoUnitario": float(i.costoUnitario or 0.0),
                "costo": float(i.costo or 0.0)
            } for i in prod_data.insumos]

            costo_total_insumos = sum(i["costo"] for i in insumos_list)
            precio_unit = float(prod_data.precioUnitario) or 0.0
            margen_pct = round(((precio_unit - costo_total_insumos) / costo_total_insumos * 100), 1) if costo_total_insumos > 0 else 0.0

            if not cat_prod:
                nuevo_cat = models.ProductoCatalogo(
                    nombre=nombre_limpio,
                    proveedor=prod_data.proveedor or "Propio",
                    costo=costo_total_insumos,
                    margen=margen_pct,
                    precio=precio_unit,
                    insumos_json=json.dumps(insumos_list)
                )
                db.add(nuevo_cat)
            elif insumos_list and (not cat_prod.insumos_json or cat_prod.insumos_json == "[]"):
                cat_prod.costo = costo_total_insumos
                cat_prod.precio = precio_unit
                cat_prod.margen = margen_pct
                cat_prod.insumos_json = json.dumps(insumos_list)


    # Sincronización de anticipo con Cuentas (MovimientoCaja)
    if pedido_obj.tipo == "PEDIDO" or pedido_obj.id.startswith("PMD-"):
        monto_anticipo = float(data.pagado or 0.0)
        cta_anticipo = getattr(data, "metodoPagoAnticipo", None) or getattr(pedido_obj, "metodo_pago_anticipo", "NU MINA") or "NU MINA"
        mov_anticipo = db.query(models.MovimientoCaja).filter(
            models.MovimientoCaja.id == f"ING-{pedido_obj.id}-ANTICIPO"
        ).first()

        if monto_anticipo > 0:
            if mov_anticipo:
                mov_anticipo.fecha = pedido_obj.fecha or datetime.date.today().isoformat()
                mov_anticipo.cuenta = cta_anticipo
                mov_anticipo.monto = monto_anticipo
                mov_anticipo.detalle = f"Anticipo Pedido | {pedido_obj.id} | {pedido_obj.cliente}"
                mov_anticipo.categoria = "Cobro Pedido"
            else:
                db.add(models.MovimientoCaja(
                    id=f"ING-{pedido_obj.id}-ANTICIPO",
                    fecha=pedido_obj.fecha or datetime.date.today().isoformat(),
                    tipo="INGRESO",
                    cuenta=cta_anticipo,
                    monto=monto_anticipo,
                    detalle=f"Anticipo Pedido | {pedido_obj.id} | {pedido_obj.cliente}",
                    pedido_id=pedido_obj.id,
                    categoria="Cobro Pedido"
                ))
        elif mov_anticipo:
            db.delete(mov_anticipo)

    # Actualizar o crear cliente
    cl = db.query(models.Cliente).filter(models.Cliente.nombre == data.cliente).first()
    if not cl:
        cl = models.Cliente(nombre=data.cliente, pedidos_totales=1, deuda=max(0.0, data.total - data.pagado), ganancia_total=data.ganancia)
        db.add(cl)
    else:
        # recalcular deuda cliente
        pedidos_cliente = db.query(models.Pedido).filter(
            models.Pedido.cliente == data.cliente,
            models.Pedido.id.like("PMD-%"),
            models.Pedido.estatus != "Cancelado"
        ).all()
        cl.deuda = sum(max(0.0, p.total - p.pagado) for p in pedidos_cliente)
        cl.ganancia_total = sum(p.ganancia_neta for p in pedidos_cliente)
        cl.pedidos_totales = len(pedidos_cliente)

    db.commit()
    return {"status": "success", "id": pedido_obj.id}

@router.put("/{pedido_id}/estatus")
def cambiar_estatus(pedido_id: str, payload: dict, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    nuevo_estatus = payload.get("estatus")
    pedido.estatus = nuevo_estatus
    if nuevo_estatus == "Entregado":
        pedido.fecha_entrega = payload.get("fechaEntrega", datetime.date.today().isoformat())
    elif nuevo_estatus == "Cancelado":
        pedido.motivo_cancelacion = payload.get("motivoCancelacion", "Cancelado por el cliente")
        # Restituir stock y revertir movimientos de inventario
        prev_movs = db.query(models.MovimientoInventario).filter(models.MovimientoInventario.pedido_id == pedido.id).all()
        for pm in prev_movs:
            inv = None
            if pm.insumo_id:
                inv = db.query(models.InsumoInventario).filter(models.InsumoInventario.id == pm.insumo_id).first()
            if not inv:
                inv = db.query(models.InsumoInventario).filter(models.InsumoInventario.nombre.ilike(pm.insumo_nombre)).first()
            if inv:
                inv.stock += pm.cant
            db.delete(pm)

        # Eliminar egresos automáticos de caja
        db.query(models.MovimientoCaja).filter(
            models.MovimientoCaja.pedido_id == pedido.id,
            models.MovimientoCaja.es_egreso_pedido == True
        ).delete()
    elif nuevo_estatus == "Aprobado":
        viejo_id = pedido.id
        if pedido.tipo == "COTIZACION" or viejo_id.startswith("CMD-"):
            existing_pmd = db.query(models.Pedido).filter(models.Pedido.id.like("PMD-%")).all()
            nums = []
            for p in existing_pmd:
                try:
                    n = int(p.id.split("-")[1])
                    if n < 700:
                        nums.append(n)
                except Exception:
                    pass
            next_num = max(nums) + 1 if nums else (len(existing_pmd) + 1)
            nuevo_pmd_id = f"PMD-{str(next_num).zfill(3)}"

            # 1. Marcar la cotización como convertida y conservarla intacta
            pedido.estatus = "Convertido"
            pedido.convertida_a_pedido = nuevo_pmd_id

            # 2. Crear nuevo Pedido oficial PMD-XXX
            nuevo_pedido = models.Pedido(
                id=nuevo_pmd_id,
                tipo="PEDIDO",
                fecha=datetime.date.today().isoformat(),
                cliente=pedido.cliente,
                requiere_factura=pedido.requiere_factura,
                tipo_persona=pedido.tipo_persona,
                subtotal=pedido.subtotal,
                iva=pedido.iva,
                retencion_isr=pedido.retencion_isr,
                total=pedido.total,
                pagado=0.0,
                costo_insumos=pedido.costo_insumos,
                costo_mermas=pedido.costo_mermas,
                ganancia_neta=pedido.ganancia_neta,
                estatus="Pendiente",
                factura_estatus="Pendiente" if pedido.requiere_factura else "-",
                factura_fecha=pedido.factura_fecha,
                fecha_entrega=pedido.fecha_entrega,
                rfc=pedido.rfc,
                razon_social=pedido.razon_social,
                cp=pedido.cp,
                regimen_fiscal=pedido.regimen_fiscal,
                uso_cfdi=pedido.uso_cfdi,
                cotizacion_origen=viejo_id,
                convertida_a_pedido=None
            )
            db.add(nuevo_pedido)
            db.flush()

            # 3. Clonar todos los productos, insumos y mermas al nuevo pedido
            for prod in pedido.productos:
                nuevo_prod = models.PedidoProducto(
                    pedido_id=nuevo_pmd_id,
                    nombre=prod.nombre,
                    proveedor=prod.proveedor,
                    cant=prod.cant,
                    precio_unitario=prod.precio_unitario,
                    costo_unitario=prod.costo_unitario,
                    nota=prod.nota or ""
                )
                db.add(nuevo_prod)
                db.flush()

                for ins in prod.insumos:
                    cant_ins = float(getattr(ins, 'cant', 1.0) or 1.0)
                    cu_ins = float(getattr(ins, 'costo_unitario', 0.0) or 0.0)
                    costo_ins = float(getattr(ins, 'costo', 0.0) or (cant_ins * cu_ins))

                    nuevo_ins = models.PedidoInsumo(
                        producto_id=nuevo_prod.id,
                        pedido_id=nuevo_pmd_id,
                        nombre=ins.nombre,
                        detalle=ins.detalle,
                        nota=ins.nota,
                        proveedor=ins.proveedor,
                        metodo_pago=ins.metodo_pago,
                        cant=cant_ins,
                        costo_unitario=cu_ins,
                        costo=costo_ins
                    )
                    db.add(nuevo_ins)
                    db.flush()

                    if ins.metodo_pago == "STOCK":
                        inv = db.query(models.InsumoInventario).filter(models.InsumoInventario.nombre.ilike(ins.nombre.strip())).first()
                        if inv:
                            inv.stock = max(0.0, inv.stock - cant_ins)
                            db.add(models.MovimientoInventario(
                                insumo_id=inv.id,
                                insumo_nombre=inv.nombre,
                                pedido_id=nuevo_pmd_id,
                                tipo="CONSUMO",
                                cant=cant_ins,
                                fecha=datetime.date.today().isoformat(),
                                motivo=f"Consumo en pedido {nuevo_pmd_id} ({prod.nombre})"
                            ))
                        else:
                            db.add(models.MovimientoInventario(
                                insumo_id=None,
                                insumo_nombre=ins.nombre.strip(),
                                pedido_id=nuevo_pmd_id,
                                tipo="CONSUMO",
                                cant=cant_ins,
                                fecha=datetime.date.today().isoformat(),
                                motivo=f"Consumo en pedido {nuevo_pmd_id} ({prod.nombre})"
                            ))
                    elif ins.metodo_pago and ins.metodo_pago != "STOCK":
                        if costo_ins > 0:
                            db.add(models.MovimientoCaja(
                                id=f"EGR-{nuevo_pmd_id}-{nuevo_prod.id}-{nuevo_ins.id}",
                                fecha=datetime.date.today().isoformat(),
                                tipo="EGRESO",
                                cuenta=ins.metodo_pago,
                                monto=costo_ins,
                                detalle=f"Egreso por insumo '{ins.nombre}' del pedido {nuevo_pmd_id}",
                                pedido_id=nuevo_pmd_id,
                                es_egreso_pedido=True
                            ))

                for mer in prod.mermas:
                    cant_merma = float(getattr(mer, 'cant', 1.0) or 1.0)
                    cu_merma = float(getattr(mer, 'costo_unitario', 0.0) or 0.0)
                    metodo_pago_mer = getattr(mer, 'metodo_pago', 'STOCK') or 'STOCK'
                    costo_merma = cant_merma * cu_merma

                    nuevo_mer = models.PedidoMerma(
                        producto_id=nuevo_prod.id,
                        material=mer.material,
                        cant=cant_merma,
                        motivo=mer.motivo,
                        costo_unitario=cu_merma,
                        metodo_pago=metodo_pago_mer
                    )
                    db.add(nuevo_mer)
                    db.flush()

                    if metodo_pago_mer == "STOCK":
                        inv_mer = db.query(models.InsumoInventario).filter(models.InsumoInventario.nombre.ilike(mer.material.strip())).first()
                        if inv_mer:
                            inv_mer.stock = max(0.0, inv_mer.stock - cant_merma)
                            db.add(models.MovimientoInventario(
                                insumo_id=inv_mer.id,
                                insumo_nombre=inv_mer.nombre,
                                pedido_id=nuevo_pmd_id,
                                tipo="MERMA",
                                cant=cant_merma,
                                fecha=datetime.date.today().isoformat(),
                                motivo=f"Merma en pedido {nuevo_pmd_id}: {mer.motivo or 'Desperdicio'}"
                            ))
                        else:
                            db.add(models.MovimientoInventario(
                                insumo_id=None,
                                insumo_nombre=mer.material.strip(),
                                pedido_id=nuevo_pmd_id,
                                tipo="MERMA",
                                cant=cant_merma,
                                fecha=datetime.date.today().isoformat(),
                                motivo=f"Merma en pedido {nuevo_pmd_id}: {mer.motivo or 'Desperdicio'}"
                            ))
                    elif metodo_pago_mer and metodo_pago_mer != "STOCK":
                        if costo_merma > 0:
                            db.add(models.MovimientoCaja(
                                id=f"EGR-MERMA-{nuevo_pmd_id}-{nuevo_prod.id}-{nuevo_mer.id}",
                                fecha=datetime.date.today().isoformat(),
                                tipo="EGRESO",
                                cuenta=metodo_pago_mer,
                                monto=costo_merma,
                                detalle=f"Egreso por merma '{mer.material}' del pedido {nuevo_pmd_id}: {mer.motivo or 'Desperdicio'}",
                                pedido_id=nuevo_pmd_id,
                                es_egreso_pedido=True
                            ))

            # Actualizar cliente
            cl = db.query(models.Cliente).filter(models.Cliente.nombre == pedido.cliente).first()
            if cl:
                cl.pedidos_totales += 1
                cl.deuda += nuevo_pedido.total

            db.commit()
            return {"status": "success", "id": nuevo_pmd_id, "cotizacionId": viejo_id, "convertidaAPedido": nuevo_pmd_id}

    db.commit()
    return {"status": "success", "id": pedido.id, "estatus": pedido.estatus, "tipo": pedido.tipo}


@router.put("/{pedido_id}/factura")
def actualizar_factura(pedido_id: str, payload: dict, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    if "facturaEstatus" in payload:
        pedido.factura_estatus = payload["facturaEstatus"]
    if "facturaFecha" in payload:
        pedido.factura_fecha = payload["facturaFecha"]
    if "facturaArchivoData" in payload:
        pedido.factura_archivo_data = payload["facturaArchivoData"]
    if "facturaArchivoNombre" in payload:
        pedido.factura_archivo_nombre = payload["facturaArchivoNombre"]

    db.commit()
    return {"status": "success", "id": pedido_id}

@router.delete("/{pedido_id}")
def eliminar_pedido(pedido_id: str, db: Session = Depends(get_db)):
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    prev_prod_ids = [p.id for p in db.query(models.PedidoProducto.id).filter(models.PedidoProducto.pedido_id == pedido_id).all()]
    if prev_prod_ids:
        db.query(models.PedidoInsumo).filter(models.PedidoInsumo.producto_id.in_(prev_prod_ids)).delete(synchronize_session=False)
        db.query(models.PedidoMerma).filter(models.PedidoMerma.producto_id.in_(prev_prod_ids)).delete(synchronize_session=False)
    db.query(models.PedidoInsumo).filter(models.PedidoInsumo.pedido_id == pedido_id).delete(synchronize_session=False)
    db.query(models.PedidoProducto).filter(models.PedidoProducto.pedido_id == pedido_id).delete(synchronize_session=False)
    
    db.query(models.MovimientoCaja).filter(models.MovimientoCaja.pedido_id == pedido_id).delete(synchronize_session=False)
    db.delete(pedido)
    db.commit()
    return {"status": "success", "id": pedido_id}

