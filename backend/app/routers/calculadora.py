from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import all_models as models
from ..schemas import all_schemas as schemas

router = APIRouter(prefix="/calculadora", tags=["calculadora"])

MATERIALES_INIT = [
    {"nombre": "Lona Front 13oz", "proveedor": "Gráficos SA", "ancho": 100.0, "alto": 100.0, "costo": 100.0},
    {"nombre": "Vinil Adhesivo Brillante", "proveedor": "Gráficos SA", "ancho": 100.0, "alto": 100.0, "costo": 85.0},
    {"nombre": "Vinil Textil Detalle", "proveedor": "Tintas Mex", "ancho": 50.0, "alto": 100.0, "costo": 120.0},
    {"nombre": "Acrílico Cristal 3mm", "proveedor": "Plásticos Mex", "ancho": 120.0, "alto": 240.0, "costo": 950.0},
    {"nombre": "Trovicel / Espumado 3mm", "proveedor": "Plásticos Mex", "ancho": 122.0, "alto": 244.0, "costo": 450.0}
]

@router.get("/materiales")
def listar_materiales(db: Session = Depends(get_db)):
    mats = db.query(models.MaterialCalculadora).all()
    return [{
        "id": m.id, "nombre": m.nombre, "proveedor": m.proveedor,
        "ancho": m.ancho, "alto": m.alto, "costo": m.costo
    } for m in mats]

@router.post("/materiales")
def guardar_material(mat: schemas.MaterialCalculadoraSchema, db: Session = Depends(get_db)):
    m = models.MaterialCalculadora(
        nombre=mat.nombre,
        proveedor=mat.proveedor,
        ancho=mat.ancho,
        alto=mat.alto,
        costo=mat.costo
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return {"status": "success", "id": m.id}

@router.delete("/materiales/{mat_id}")
def eliminar_material(mat_id: int, db: Session = Depends(get_db)):
    db.query(models.MaterialCalculadora).filter(models.MaterialCalculadora.id == mat_id).delete()
    db.commit()
    return {"status": "success"}
