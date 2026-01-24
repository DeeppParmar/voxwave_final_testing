import uvicorn
import os
from backend.main import app  # Re-export app for production servers expecting main:app

if __name__ == "__main__":
    print("🚀 Starting VoxWave API...")
    # Using the module path syntax
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").strip().lower() in {"1", "true", "yes"}
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=reload)