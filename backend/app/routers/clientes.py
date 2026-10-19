from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.all_models import Cliente
from ..schemas.all_schemas import ClienteSchema

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("", response_model=List[ClienteSchema])
def get_clientes(db: Session = Depends(get_db)):
    clientes = db.query(Cliente).all()
    return [{
        "nombre": c.nombre,
        "rfc": c.rfc or "",
        "cp": c.cp or "",
        "regimen": c.regimen or "",
        "usoCfdi": c.uso_cfdi or "",
        "correo": c.correo or "",
        "telefono": c.telefono or "",
        "pedidos": c.pedidos_totales or 0,
        "deuda": c.deuda or 0.0,
        "ganancia": c.ganancia_total or 0.0
    } for c in clientes]

@router.post("", response_model=ClienteSchema)
def create_or_update_cliente(cliente_data: ClienteSchema, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.nombre == cliente_data.nombre).first()
    if cliente:
        cliente.rfc = cliente_data.rfc or ""
        cliente.cp = cliente_data.cp or ""
        cliente.regimen = cliente_data.regimen or ""
        cliente.uso_cfdi = cliente_data.usoCfdi or ""
        cliente.correo = cliente_data.correo or ""
        cliente.telefono = cliente_data.telefono or ""
        if cliente_data.pedidos is not None:
            cliente.pedidos_totales = cliente_data.pedidos
        if cliente_data.deuda is not None:
            cliente.deuda = cliente_data.deuda
        if cliente_data.ganancia is not None:
            cliente.ganancia_total = cliente_data.ganancia
    else:
        cliente = Cliente(
            nombre=cliente_data.nombre,
            rfc=cliente_data.rfc or "",
            cp=cliente_data.cp or "",
            regimen=cliente_data.regimen or "",
            uso_cfdi=cliente_data.usoCfdi or "",
            correo=cliente_data.correo or "",
            telefono=cliente_data.telefono or "",
            pedidos_totales=cliente_data.pedidos or 0,
            deuda=cliente_data.deuda or 0.0,
            ganancia_total=cliente_data.ganancia or 0.0
        )
        db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return {
        "nombre": cliente.nombre,
        "rfc": cliente.rfc or "",
        "cp": cliente.cp or "",
        "regimen": cliente.regimen or "",
        "usoCfdi": cliente.uso_cfdi or "",
        "correo": cliente.correo or "",
        "telefono": cliente.telefono or "",
        "pedidos": cliente.pedidos_totales or 0,
        "deuda": cliente.deuda or 0.0,
        "ganancia": cliente.ganancia_total or 0.0
    }

@router.delete("/{nombre}")
def delete_cliente(nombre: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.nombre == nombre).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
    return {"message": "Cliente eliminado", "nombre": nombre}
