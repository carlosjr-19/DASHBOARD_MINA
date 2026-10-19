import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import config  # noqa: F401  (carga backend/.env en local)

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


# Usuario Administrador definido por variables de entorno (backend/.env en local, Variables en Railway)
# ADMIN_EMAIL y ADMIN_PASSWORD.
def _obtener_admin():
    email = (os.getenv("ADMIN_EMAIL") or "").strip().lower()
    password = (os.getenv("ADMIN_PASSWORD") or "").strip()
    if not email or not password:
        print("[AUTH] ADVERTENCIA: no está configurado ADMIN_EMAIL o ADMIN_PASSWORD en el entorno.")
    return {
        "email": email,
        "password": password,
        "role": "admin",
        "nombre": "Administración"
    }


@router.post("/login")
def login(creds: LoginRequest):
    admin = _obtener_admin()
    input_user = creds.email.lower().strip()
    input_pwd = creds.password.strip()

    # Solo se permite el acceso al usuario ADMIN (ya sea con su correo configurado o con el usuario "admin")
    es_admin = bool(admin["email"]) and (input_user == admin["email"] or input_user == "admin")

    if not es_admin or input_pwd != admin["password"]:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    return {
        "success": True,
        "email": admin["email"],
        "role": admin["role"],
        "nombre": admin["nombre"]
    }
