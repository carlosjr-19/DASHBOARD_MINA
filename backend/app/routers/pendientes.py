import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db, engine
from ..models import all_models as models
from ..schemas import all_schemas as schemas

router = APIRouter(prefix="/pendientes", tags=["pendientes"])

def init_pendientes_db():
    try:
        models.Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE pendientes ADD COLUMN titulo VARCHAR DEFAULT ''"))
                conn.commit()
            except Exception:
                pass
    except Exception as e:
        print("Pendientes DB init warning:", e)

init_pendientes_db()

def format_pendiente_dict(p: models.Pendiente):
    try:
        comentarios = json.loads(p.comentarios_json or "[]")
    except Exception:
        comentarios = []

    return {
        "id": p.id,
        "titulo": getattr(p, "titulo", "") or (p.descripcion[:50] if p.descripcion else "Sin título"),
        "descripcion": p.descripcion or "",
        "urgencia": p.urgencia or "Media",
        "quienPide": p.quien_pide or "",
        "paraQuien": p.para_quien or "",
        "deQuienDepende": p.de_quien_depende or "",
        "fechaSolicitud": p.fecha_solicitud or "",
        "fechaEntrega": p.fecha_entrega or "",
        "estatus": p.estatus or "Pendiente",
        "comentarios": comentarios,
        "createdAt": p.created_at,
        "updatedAt": p.updated_at
    }

@router.get("")
def listar_pendientes(db: Session = Depends(get_db)):
    items = db.query(models.Pendiente).order_by(models.Pendiente.id.desc()).all()
    return [format_pendiente_dict(p) for p in items]

@router.post("")
def guardar_pendiente(data: schemas.PendienteCreateSchema, db: Session = Depends(get_db)):
    comentarios_serialized = json.dumps([c.model_dump() if hasattr(c, "model_dump") else c.dict() for c in (data.comentarios or [])])
    today_iso = datetime.date.today().isoformat()
    now_iso = datetime.datetime.now().isoformat()

    if data.id:
        p = db.query(models.Pendiente).filter(models.Pendiente.id == data.id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Pendiente no encontrado")
        p.titulo = data.titulo or (data.descripcion[:50] if data.descripcion else "")
        p.descripcion = data.descripcion or ""
        p.urgencia = data.urgencia or "Media"
        p.quien_pide = data.quien_pide or ""
        p.para_quien = data.para_quien or ""
        p.de_quien_depende = data.de_quien_depende or ""
        p.fecha_solicitud = data.fecha_solicitud or p.fecha_solicitud or today_iso
        p.fecha_entrega = data.fecha_entrega or ""
        p.estatus = data.estatus or p.estatus or "Pendiente"
        if data.comentarios is not None and len(data.comentarios) > 0:
            p.comentarios_json = comentarios_serialized
        p.updated_at = now_iso
    else:
        p = models.Pendiente(
            titulo=data.titulo or (data.descripcion[:50] if data.descripcion else ""),
            descripcion=data.descripcion or "",
            urgencia=data.urgencia or "Media",
            quien_pide=data.quien_pide or "",
            para_quien=data.para_quien or "",
            de_quien_depende=data.de_quien_depende or "",
            fecha_solicitud=data.fecha_solicitud or today_iso,
            fecha_entrega=data.fecha_entrega or "",
            estatus=data.estatus or "Pendiente",
            comentarios_json=comentarios_serialized,
            created_at=now_iso,
            updated_at=now_iso
        )
        db.add(p)

    db.commit()
    db.refresh(p)
    return format_pendiente_dict(p)

@router.put("/{pendiente_id}/estatus")
def actualizar_estatus(pendiente_id: int, payload: schemas.PendienteEstatusUpdate, db: Session = Depends(get_db)):
    p = db.query(models.Pendiente).filter(models.Pendiente.id == pendiente_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pendiente no encontrado")
    p.estatus = payload.estatus
    p.updated_at = datetime.datetime.now().isoformat()
    db.commit()
    db.refresh(p)
    return format_pendiente_dict(p)

@router.post("/{pendiente_id}/comentarios")
def agregar_comentario(pendiente_id: int, payload: schemas.NuevoComentarioSchema, db: Session = Depends(get_db)):
    p = db.query(models.Pendiente).filter(models.Pendiente.id == pendiente_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pendiente no encontrado")
    
    try:
        coms = json.loads(p.comentarios_json or "[]")
    except Exception:
        coms = []

    nuevo = {
        "id": f"com-{int(datetime.datetime.now().timestamp()*1000)}",
        "fecha": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "autor": payload.autor or "Usuario",
        "texto": payload.texto.strip()
    }
    coms.append(nuevo)
    p.comentarios_json = json.dumps(coms)
    if payload.nuevoEstatus:
        p.estatus = payload.nuevoEstatus
    p.updated_at = datetime.datetime.now().isoformat()
    db.commit()
    db.refresh(p)
    return format_pendiente_dict(p)

@router.delete("/{pendiente_id}")
def eliminar_pendiente(pendiente_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Pendiente).filter(models.Pendiente.id == pendiente_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pendiente no encontrado")
    db.delete(p)
    db.commit()
    return {"ok": True, "message": "Pendiente eliminado"}
