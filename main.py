import uvicorn
import os
from backend.main import app  # Re-export app for production servers expecting main:app

if __name__ == "__main__":
    print("🚀 Starting VoxWave API...")