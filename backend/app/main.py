import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .database import engine, Base
from .routers import pedidos, inventario, finanzas, calculadora, clientes, auth, catalogo

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MINA DESIGN ERP API", version="2.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(pedidos.router, prefix="/api")
app.include_router(inventario.router, prefix="/api")
app.include_router(finanzas.router, prefix="/api")
app.include_router(calculadora.router, prefix="/api")
app.include_router(clientes.router, prefix="/api")
app.include_router(catalogo.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "MINA DESIGN ERP", "version": "2.0.0"}

# Production Static Files (Frontend built)
class FrontendStaticFiles(StaticFiles):
    """Sirve el frontend compilado controlando la caché del navegador:
    - index.html: siempre se revalida, para que cada nuevo deploy se vea al instante.
    - /assets/*: llevan hash en el nombre, se pueden cachear por mucho tiempo.
    """

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if path.startswith("assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        else:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response


frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", FrontendStaticFiles(directory=frontend_dist, html=True), name="static")
