import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .. import config  # noqa: F401  (carga backend/.env en local)

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


# Usuarios definidos por variables de entorno (backend/.env en local, Variables en Railway)
# <ROL>_EMAIL y <ROL>_PASSWORD. Si falta alguna de las dos, ese usuario no se habilita.
_ROLES = [
    ("ADMIN", "admin", "Administración"),
    ("PRODUCCION", "produccion", "Producción"),
    ("COTIZACIONES", "cotizaciones", "Cotizaciones"),
]


def _cargar_usuarios():
    usuarios = {}
    for prefijo, role, nombre in _ROLES:
        email = (os.getenv(f"{prefijo}_EMAIL") or "").strip().lower()
        password = (os.getenv(f"{prefijo}_PASSWORD") or "").strip()
        if email and password:
            usuarios[email] = {"password": password, "role": role, "nombre": nombre}
    if not usuarios:
        print("[AUTH] ADVERTENCIA: no hay usuarios configurados. Define ADMIN_EMAIL / ADMIN_PASSWORD, etc.")
    return usuarios


USER_ROLES = _cargar_usuarios()


@router.post("/login")
def login(creds: LoginRequest):
    user_info = USER_ROLES.get(creds.email.lower().strip())
    if not user_info or user_info["password"] != creds.password.strip():
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {
        "success": True,
        "email": creds.email,
        "role": user_info["role"],
        "nombre": user_info["nombre"]
    }
