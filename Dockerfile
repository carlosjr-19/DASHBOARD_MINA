# ==========================================
# STAGE 1: Compilar Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Instalar dependencias (usa package-lock.json si existe)
COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copiar código fuente y compilar
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Servidor Backend (FastAPI + Python)
# ==========================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    DATA_DIR=/data

WORKDIR /app

# Dependencias del backend
COPY backend/requirements.txt ./backend/
RUN pip install -r ./backend/requirements.txt

# Código del backend
COPY backend/ ./backend/

# Frontend compilado desde el Stage 1 (FastAPI lo sirve en "/")
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Carpeta persistente para la base SQLite (montar aquí el Volume de Railway)
RUN mkdir -p /data

WORKDIR /app/backend

EXPOSE 8000

# Railway inyecta $PORT; en local se usa 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
