import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base, _migrate
from auth import AuthMiddleware
from routers import profiles, measurements, goals, upload

# Create all tables, then run migrations
Base.metadata.create_all(bind=engine)
_migrate()

app = FastAPI(title="JEMO Health API", version="1.0.0")

# Auth middleware (local IP bypass, optional password for external)
app.add_middleware(AuthMiddleware)

# CORS — allow frontend dev server only (in production, same origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router)
app.include_router(measurements.router)
app.include_router(goals.router)
app.include_router(upload.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# Serve built React frontend (production)
_static = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_static):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa():
        return FileResponse(os.path.join(_static, "index.html"))
