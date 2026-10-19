"""Carga de configuración desde variables de entorno.

- En local: se leen de backend/.env o backend/app/.env (no se sube a GitHub).
- En Railway: se leen de la pestaña "Variables" del servicio.
Las variables reales del sistema siempre tienen prioridad sobre el .env.
"""
import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_DIR = os.path.dirname(__file__)

# Intentar cargar .env desde backend/ o backend/app/
env_backend = os.path.join(BACKEND_DIR, ".env")
env_app = os.path.join(APP_DIR, ".env")

if os.path.exists(env_backend):
    load_dotenv(env_backend, override=False)
if os.path.exists(env_app):
    load_dotenv(env_app, override=False)
