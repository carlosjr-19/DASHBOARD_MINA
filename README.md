# MINA DESIGN ERP

Sistema ERP (pedidos, cotizaciones, inventario, finanzas, catálogo) con
**FastAPI + SQLite (local) / PostgreSQL (producción)** en el backend y **React + Vite + Tailwind** en el frontend.
Una sola imagen Docker compila el frontend y lo sirve desde FastAPI.

```
backend/   API FastAPI (app/main.py) — sirve /api/* y el frontend compilado
frontend/  React + Vite (se compila dentro de Docker)
Dockerfile Imagen multi-stage (Node 20 -> Python 3.11)
railway.json Configuración de despliegue en Railway
```

## Correr con Docker en local

```bash
docker build -t mina-design-erp .
docker run -d -p 8000:8000 --env-file backend/.env -v mina_data:/data --name mina-erp mina-design-erp
```
Abrir http://localhost:8000 (Swagger en `/docs`).

## Cómo elige la base de datos

| Entorno | `DATABASE_URL` | Base usada |
|---|---|---|
| Local (tu PC) | no definida | SQLite en `backend/app/db/mina_design.db` |
| Railway | `${{Postgres.DATABASE_URL}}` | PostgreSQL de Railway |

Las credenciales de usuario también vienen de variables de entorno.
En local se leen de `backend/.env` (no se sube a GitHub; plantilla en `.env.example`).

## Subir a GitHub

```bash
git init
git add .
git commit -m "Primer commit: MINA DESIGN ERP"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

## Desplegar en Railway

1. **New Project → Deploy from GitHub repo** y elige el repositorio
   (Railway usa `railway.json` y el `Dockerfile`).
2. En el mismo proyecto: **+ New → Database → PostgreSQL**.
3. En el servicio de la app, pestaña **Variables**, agrega:

   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ADMIN_EMAIL=...
   ADMIN_PASSWORD=...
   PRODUCCION_EMAIL=...
   PRODUCCION_PASSWORD=...
   COTIZACIONES_EMAIL=...
   COTIZACIONES_PASSWORD=...
   ```
   (`Postgres` es el nombre del servicio de base de datos; si lo renombraste, usa ese nombre.)
4. **Settings → Networking → Generate Domain** para la URL pública.
5. Las tablas se crean solas en el primer arranque. `PORT` lo asigna Railway.

### Pasar tus datos actuales de SQLite a PostgreSQL (una sola vez)

1. En Railway, servicio **Postgres → Variables**, copia `DATABASE_PUBLIC_URL`
   (la URL pública; la interna solo funciona dentro de Railway).
2. Desde la carpeta `backend` en tu PC:

   ```bash
   pip install -r requirements.txt
   python scripts/migrar_sqlite_a_postgres.py "postgresql://postgres:...@...proxy.rlwy.net:XXXXX/railway"
   ```
   Si la base de Railway ya tiene datos, el script se detiene; agrega `--reemplazar` para sobrescribirla.

## Desarrollo local (Windows)

- `iniciar_sistema.bat`: arranca el backend en http://localhost:8000
- `iniciar_desarrollo.bat`: backend + Vite con hot reload en http://localhost:5173
