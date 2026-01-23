from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import logging
import os
from pathlib import Path

from .core.config import TEMPLATES_AVAILABLE, templates, STATIC_DIR, DB_PATH
from .api.endpoints import router as api_router
from .services.auth import init_auth_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VoxWave API",
    description="A modern music streaming API with YouTube integration and local file support",
    version="2.0.0"
)

# CORS Config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://voxwave-final-testing.vercel.app",  # Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files
# We mount "static" to serve general static files (images, etc)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Check for React build
ROOT_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT_DIR / "main_frontend" / "dist"

if (DIST_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

# Include API Router
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    init_auth_db()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "voxwave-backend"}

@app.get("/", response_class=HTMLResponse)
async def read_root():
    if (DIST_DIR / "index.html").exists():
        with open(DIST_DIR / "index.html", "r", encoding="utf-8") as f:
            return f.read()
    elif TEMPLATES_AVAILABLE and templates:
        # Fallback to templates if needed, or simple message
        return "<h1>VoxWave Backend Running. React build not found.</h1>"
    else:
        return "<h1>VoxWave Backend Running</h1>"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
