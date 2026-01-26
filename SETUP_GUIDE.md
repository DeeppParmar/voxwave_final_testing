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

## ngrok Setup (Expose Backend Publicly)

Use ngrok when you want your locally-running FastAPI backend to be reachable from the internet (for testing from another device, sharing with friends, or using a deployed frontend).

### Step 1: Install and Login

1. Install ngrok.
2. Authenticate (one-time):
 
```powershell
ngrok config add-authtoken <YOUR_TOKEN>
```

### Step 2: Start Backend Locally

```powershell
python main.py
```

Backend runs on `http://localhost:8000`.

### Step 3: Start ngrok Tunnel

```powershell
ngrok http 8000
```

ngrok will print a public URL like `https://xxxx.ngrok-free.app`.

### Step 4: Point Frontend to ngrok Backend

You have two common ways to do this:

#### Option A (Recommended): Use `VITE_API_URL`

In `main_frontend/.env` set:

```bash
VITE_API_URL=https://xxxx.ngrok-free.app
```

If you don’t set `VITE_WS_URL`, the app will automatically derive WebSocket URL from `VITE_API_URL`.

#### Option B: Use Vite Proxy Target (dev only)

If you want to keep frontend requests relative during dev, you can set:

```bash
VITE_PROXY_TARGET=https://xxxx.ngrok-free.app
```

Then run:

```powershell
cd main_frontend
npm run dev
```

### Step 5: Fix Room Invite Links (Optional)

If your frontend is on a different domain than your backend (example: Vercel frontend + ngrok backend), set this environment variable for the backend:

```bash
FRONTEND_BASE_URL=https://your-frontend-domain
```

This makes `/create-room` return an invite link that points to your frontend domain.

## Vercel Deployment (Frontend)

This repo’s frontend is a Vite SPA under `main_frontend/`. The easiest supported Vercel setup is:
- Deploy **frontend** on Vercel
- Host **backend** separately (local + ngrok, or a backend host)

### Step 1: Create a Vercel Project

1. Push your repo to GitHub.
2. In Vercel, import the repo.
3. Set **Root Directory** to `main_frontend`.

### Step 2: Configure Build

Vercel should auto-detect Vite.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

A `main_frontend/vercel.json` is included to ensure React Router routes work on refresh.

### Step 3: Set Environment Variables (Vercel)

In Vercel Project Settings → Environment Variables:

- `VITE_API_URL` = your backend public URL
  - Example (ngrok): `https://xxxx.ngrok-free.app`
- (Optional) `VITE_WS_URL` = your backend websocket base
  - Example (ngrok): `wss://xxxx.ngrok-free.app`

Redeploy after adding/changing env vars.

### Important Notes

- WebSockets require the backend to support them at a stable `wss://` URL.
- If you deploy the backend to a platform that does not support long-lived WebSockets, the “Listen Together” feature may not work.

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
