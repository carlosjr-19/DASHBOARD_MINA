"""
Copia todos los datos de la base SQLite local a una base PostgreSQL (ej. la de Railway).

Uso (desde la carpeta backend):
    python scripts/migrar_sqlite_a_postgres.py "postgresql://usuario:pass@host:puerto/railway"

- Crea las tablas en PostgreSQL si no existen.
- Si una tabla de destino ya tiene datos, se detiene (usa --reemplazar para vaciarlas antes).
- Ajusta las secuencias de los IDs numéricos para que los nuevos registros no choquen.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine, inspect, select, text  # noqa: E402
from app.models import all_models  # noqa: E402,F401  (registra los modelos)
from app.database import Base, DEFAULT_SQLITE_PATH, normalizar_url  # noqa: E402


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    reemplazar = "--reemplazar" in sys.argv
    if not args:
        print(__doc__)
        sys.exit(1)

    destino_url = normalizar_url(args[0].strip())
    origen_path = args[1] if len(args) > 1 else DEFAULT_SQLITE_PATH

    if not os.path.exists(origen_path):
        sys.exit(f"No se encontró la base SQLite: {origen_path}")

    origen = create_engine(f"sqlite:///{origen_path}")
    destino = create_engine(destino_url)

    print(f"Origen : {origen_path}")
    print(f"Destino: {destino.url.render_as_string(hide_password=True)}")

    Base.metadata.create_all(bind=destino)
    tablas_origen = set(inspect(origen).get_table_names())
    tablas = Base.metadata.sorted_tables  # orden respetando llaves foráneas

    with destino.begin() as dst:
        # Verificar / vaciar destino
        for t in tablas:
            n = dst.execute(select(text("count(*)")).select_from(t)).scalar()
            if n and not reemplazar:
                sys.exit(f"La tabla '{t.name}' ya tiene {n} registros en destino. "
                         f"Ejecuta con --reemplazar para sobrescribir.")
        if reemplazar:
            for t in reversed(tablas):
                dst.execute(t.delete())

        with origen.connect() as src:
            for t in tablas:
                if t.name not in tablas_origen:
                    print(f"  - {t.name}: no existe en SQLite, se omite")
                    continue
                cols_origen = {c["name"] for c in inspect(origen).get_columns(t.name)}
                cols = [c for c in t.columns if c.name in cols_origen]
                filas = [dict(r._mapping) for r in src.execute(select(*cols))]
                if filas:
                    dst.execute(t.insert(), filas)
                print(f"  - {t.name}: {len(filas)} registros")

        # Reajustar secuencias de IDs enteros autoincrementales
        for t in tablas:
            pk = list(t.primary_key.columns)
            if len(pk) == 1 and pk[0].type.python_type is int:
                dst.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{t.name}', '{pk[0].name}'), "
                    f"COALESCE((SELECT MAX({pk[0].name}) FROM {t.name}), 0) + 1, false)"
                ))

    print("Migración completada.")


if __name__ == "__main__":
    main()
