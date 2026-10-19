from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import all_models as models
from ..schemas import all_schemas as schemas

router = APIRouter(prefix="/inventario", tags=["inventario"])

@router.get("")
def listar_inventario(db: Session = Depends(get_db)):
    items = db.query(models.InsumoInventario).order_by(models.InsumoInventario.nombre.asc()).all()
    resultado = []
    for i in items:
        movs = db.query(models.MovimientoInventario).filter(
            (models.MovimientoInventario.insumo_id == i.id) |
            (models.MovimientoInventario.insumo_nombre.ilike(i.nombre))
        ).order_by(models.MovimientoInventario.id.desc()).all()

        usos = [{
            "id": m.id,
            "pedidoId": m.pedido_id,
            "tipo": m.tipo,
            "cant": m.cant,
            "fecha": m.fecha,
            "motivo": m.motivo
        } for m in movs]

        resultado.append({
            "id": i.id,
            "nombre": i.nombre,
            "proveedor": i.proveedor,
            "precio": i.precio,
            "stock": i.stock,
            "alerta": i.alerta,
            "usos": usos
        })
    return resultado

@router.post("")
def guardar_inventario(item: schemas.InsumoInventarioSchema, db: Session = Depends(get_db)):
    if item.id:
        existente = db.query(models.InsumoInventario).filter(models.InsumoInventario.id == item.id).first()
        if existente:
            existente.nombre = item.nombre
            existente.proveedor = item.proveedor
            existente.precio = item.precio
            existente.stock = item.stock
            existente.alerta = item.alerta
            db.commit()
            return {"status": "success", "id": existente.id}
    
    nuevo = models.InsumoInventario(
        nombre=item.nombre,
        proveedor=item.proveedor,
        precio=item.precio,
        stock=item.stock,
        alerta=item.alerta
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"status": "success", "id": nuevo.id}

@router.delete("/{item_id}")
def eliminar_inventario(item_id: int, db: Session = Depends(get_db)):
    db.query(models.InsumoInventario).filter(models.InsumoInventario.id == item_id).delete()
    db.commit()
    return {"status": "success"}
