from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from ..database import get_db
from ..models import all_models as models
from ..schemas import all_schemas as schemas

router = APIRouter(prefix="/calculadora", tags=["calculadora"])

def init_calculadora_db():
    try:
        from ..database import engine
        models.Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        cols = [c["name"] for c in inspector.get_columns("materiales_calculadora")]
        with engine.connect() as conn:
            if "precio_cliente" not in cols:
                conn.exec_driver_sql("ALTER TABLE materiales_calculadora ADD COLUMN precio_cliente FLOAT DEFAULT 0.0")
                conn.commit()
    except Exception as e:
        print("Calculadora DB migration warning:", e)

init_calculadora_db()

MATERIALES_INIT = [
    {"nombre": "Lona Front 13oz", "proveedor": "Gráficos SA", "ancho": 100.0, "alto": 100.0, "costo": 100.0, "precio_cliente": 160.0},
    {"nombre": "Vinil Adhesivo Brillante", "proveedor": "Gráficos SA", "ancho": 100.0, "alto": 100.0, "costo": 85.0, "precio_cliente": 150.0},
    {"nombre": "Vinil Textil Detalle", "proveedor": "Tintas Mex", "ancho": 50.0, "alto": 100.0, "costo": 120.0, "precio_cliente": 200.0},
    {"nombre": "Acrílico Cristal 3mm", "proveedor": "Plásticos Mex", "ancho": 120.0, "alto": 240.0, "costo": 950.0, "precio_cliente": 1600.0},
    {"nombre": "Trovicel / Espumado 3mm", "proveedor": "Plásticos Mex", "ancho": 122.0, "alto": 244.0, "costo": 450.0, "precio_cliente": 800.0}
]

@router.get("/materiales")
def listar_materiales(db: Session = Depends(get_db)):
    mats = db.query(models.MaterialCalculadora).all()
    return [{
        "id": m.id, "nombre": m.nombre, "proveedor": m.proveedor,
        "ancho": m.ancho, "alto": m.alto, "costo": m.costo,
        "precioCliente": getattr(m, "precio_cliente", 0.0) or 0.0,
        "precio_cliente": getattr(m, "precio_cliente", 0.0) or 0.0
    } for m in mats]

@router.post("/materiales")
def guardar_material(mat: schemas.MaterialCalculadoraSchema, db: Session = Depends(get_db)):
    precio_cli = getattr(mat, "precioCliente", None)
    if precio_cli is None or precio_cli == 0.0:
        precio_cli = getattr(mat, "precio_cliente", 0.0) or 0.0
    m = models.MaterialCalculadora(
        nombre=mat.nombre,
        proveedor=mat.proveedor,
        ancho=mat.ancho,
        alto=mat.alto,
        costo=mat.costo,
        precio_cliente=float(precio_cli or 0.0)
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return {
        "status": "success",
        "id": m.id,
        "nombre": m.nombre,
        "proveedor": m.proveedor,
        "ancho": m.ancho,
        "alto": m.alto,
        "costo": m.costo,
        "precioCliente": m.precio_cliente,
        "precio_cliente": m.precio_cliente
    }

@router.delete("/materiales/{mat_id}")
def eliminar_material(mat_id: int, db: Session = Depends(get_db)):
    db.query(models.MaterialCalculadora).filter(models.MaterialCalculadora.id == mat_id).delete()
    db.commit()
    return {"status": "success"}
