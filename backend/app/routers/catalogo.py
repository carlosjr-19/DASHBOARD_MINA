import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import all_models as models
from ..schemas import all_schemas as schemas

router = APIRouter(prefix="/catalogo", tags=["Catálogo de Productos"])

@router.get("", response_model=List[schemas.ProductoCatalogoSchema])
def get_catalogo(db: Session = Depends(get_db)):
    productos = db.query(models.ProductoCatalogo).order_by(models.ProductoCatalogo.nombre.asc()).all()
    resultado = []
    for p in productos:
        insumos = []
        try:
            if p.insumos_json:
                insumos = json.loads(p.insumos_json)
        except Exception:
            insumos = []
        resultado.append({
            "id": p.id,
            "nombre": p.nombre,
            "proveedor": p.proveedor or "Propio",
            "costo": p.costo or 0.0,
            "margen": p.margen or 0.0,
            "precio": p.precio or 0.0,
            "insumos": insumos
        })
    return resultado

@router.post("", response_model=schemas.ProductoCatalogoSchema)
def guardar_producto_catalogo(item: schemas.ProductoCatalogoSchema, db: Session = Depends(get_db)):
    prod = None
    if item.id:
        prod = db.query(models.ProductoCatalogo).filter(models.ProductoCatalogo.id == item.id).first()
    if not prod:
        prod = db.query(models.ProductoCatalogo).filter(models.ProductoCatalogo.nombre.ilike(item.nombre.strip())).first()

    insumos_dict_list = [i.model_dump() if hasattr(i, "model_dump") else i.dict() for i in item.insumos]

    # Calcular costo real si no viene o viene en 0
    costo_calc = sum((float(i.get("cant", 1.0) or 1.0) * float(i.get("costoUnitario", 0.0) or 0.0)) for i in insumos_dict_list)
    final_costo = item.costo if item.costo > 0 else costo_calc

    if prod:
        prod.nombre = item.nombre.strip()
        prod.proveedor = item.proveedor or "Propio"
        prod.costo = final_costo
        prod.margen = item.margen
        prod.precio = item.precio
        prod.insumos_json = json.dumps(insumos_dict_list)
    else:
        prod = models.ProductoCatalogo(
            nombre=item.nombre.strip(),
            proveedor=item.proveedor or "Propio",
            costo=final_costo,
            margen=item.margen,
            precio=item.precio,
            insumos_json=json.dumps(insumos_dict_list)
        )
        db.add(prod)

    db.commit()
    db.refresh(prod)
    
    insumos_resp = []
    try:
        insumos_resp = json.loads(prod.insumos_json)
    except Exception:
        insumos_resp = []

    return {
        "id": prod.id,
        "nombre": prod.nombre,
        "proveedor": prod.proveedor,
        "costo": prod.costo,
        "margen": prod.margen,
        "precio": prod.precio,
        "insumos": insumos_resp
    }

@router.delete("/{producto_id}")
def eliminar_producto_catalogo(producto_id: int, db: Session = Depends(get_db)):
    prod = db.query(models.ProductoCatalogo).filter(models.ProductoCatalogo.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(prod)
    db.commit()
    return {"ok": True, "message": "Producto eliminado exitosamente"}
