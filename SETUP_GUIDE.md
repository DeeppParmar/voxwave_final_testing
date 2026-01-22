# VoxWave - Step-by-Step Setup Guide

This guide will walk you through setting up and running VoxWave on Windows.

## Prerequisites Check

Before starting, make sure you have:

1. **Python 3.8+** installed
   - Check: Open PowerShell and run `python --version`
   - If not installed: Download from [python.org](https://www.python.org/downloads/)

2. **Node.js 16+** installed
   - Check: Open PowerShell and run `node --version` and `npm --version`
   - If not installed: Download from [nodejs.org](https://nodejs.org/)

## Installation Steps

### Step 1: Install Python Dependencies

Open PowerShell in the VoxWave directory and run:

```powershell
pip install -r requirements.txt
```

This installs:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- pytubefix (YouTube audio extraction)
- youtube-search-python (YouTube search)
- Other required packages

### Step 2: Install Node.js Dependencies

Open PowerShell, navigate to the **frontend directory**, and install dependencies:

```powershell
cd main_frontend
npm install
```

This installs React, Vite, and other frontend dependencies.

## Running the Application

You have **two options** to run the app:

### Option A: Run Servers Manually (Recommended)

**Terminal 1 - Backend Server:**
Open PowerShell in the root `VoxWave` folder:
```powershell
python main.py
```
The backend will run on `http://localhost:8000`

**Terminal 2 - Frontend Server:**
Open PowerShell in the `main_frontend` folder:
```powershell
cd main_frontend
npm run dev
```
The frontend will run on `http://localhost:5173` (or similar, check terminal output)

### Option B: Run via Root Script (If configured)

If you have `concurrently` installed in the root:
```powershell
npm run dev
```

## Accessing the Application

Once both servers are running:

1. **Frontend**: Open your browser and go to the link shown in the frontend terminal (usually `http://localhost:5173` or `http://localhost:3000`)
   - This is where you'll interact with the music player

2. **Backend API**: Available at `http://localhost:8000`
   - API docs available at `http://localhost:8000/docs`

## Troubleshooting

### Issue: "python is not recognized"
- Make sure Python is installed and added to PATH
- Try using `py` instead of `python` on Windows

### Issue: Port already in use
- Backend (port 8000): Close other applications using this port
- Frontend: Vite will automatically try the next available port

### Issue: YouTube playback fails
- Ensure `pytubefix` is installed: `pip install pytubefix`
- If you see "Sign into YouTube" errors, update it: `pip install --upgrade pytubefix`

## Project Structure

```
VoxWave/
├── main.py              # Backend entry point
├── requirements.txt     # Python dependencies
├── backend/             # Backend source code
│   ├── api/             # API endpoints
│   ├── services/        # Business logic (YouTube, Rooms)
│   └── core/            # Config
├── main_frontend/       # Frontend source code
│   ├── src/             # React source
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Vite config
└── uploads/             # local music storage
```
