import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

from . import config  # noqa: F401  (carga backend/.env en local)

# ============================================================
# Selección de base de datos
#  - Local (sin DATABASE_URL): SQLite en backend/app/db/mina_design.db
#  - Producción / Railway: PostgreSQL vía la variable DATABASE_URL
# ============================================================
APP_DB_DIR = os.path.join(os.path.dirname(__file__), "db")
DB_DIR = os.getenv("DATA_DIR") or APP_DB_DIR
os.makedirs(DB_DIR, exist_ok=True)
DEFAULT_SQLITE_PATH = os.path.join(DB_DIR, "mina_design.db").replace("\\", "/")

DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip() or f"sqlite:///{DEFAULT_SQLITE_PATH}"



def normalizar_url(url: str) -> str:
    """Railway entrega 'postgresql://...' (o 'postgres://'); forzamos el driver psycopg 3."""
    for prefijo in ("postgres://", "postgresql://", "postgresql+psycopg2://"):
        if url.startswith(prefijo):
            return "postgresql+psycopg://" + url[len(prefijo):]
    return url


DATABASE_URL = normalizar_url(DATABASE_URL)

IS_SQLITE = DATABASE_URL.startswith("sqlite")

if IS_SQLITE:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,   # reconecta si Railway cerró la conexión
        pool_size=5,
        max_overflow=10,
        pool_recycle=1800,
    )

print(f"[DB] Usando {'SQLite (local)' if IS_SQLITE else 'PostgreSQL'}: {engine.url.render_as_string(hide_password=True)}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
