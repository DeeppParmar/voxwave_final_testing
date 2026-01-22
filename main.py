import uvicorn
import os

if __name__ == "__main__":
    print("🚀 Starting VoxWave API...")
    # Using the module path syntax
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)