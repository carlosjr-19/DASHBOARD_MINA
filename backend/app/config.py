"""Carga de configuración desde variables de entorno.

- En local: se leen de backend/.env (no se sube a GitHub).
- En Railway: se leen de la pestaña "Variables" del servicio.
Las variables reales del sistema siempre tienen prioridad sobre el .env.
"""
import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BACKEND_DIR, ".env"), override=False)
