# VoxWave - Modern Music Streaming Platform

A modern, full-stack music streaming application built with React and FastAPI. Stream music from YouTube, upload local files, create playlists, and listen together with friends in real-time.

## Features

- 🎵 **YouTube Integration**: Search and stream music from YouTube
- 📁 **Local File Upload**: Upload and play your own music files (MP3, WAV, M4A, FLAC, OGG)
- ❤️ **Liked Songs**: Save your favorite tracks
- 📋 **Queue Management**: Create and manage playlists
- 👥 **Listen Together**: Real-time synchronized listening with friends via WebSocket
- 🎨 **Modern UI**: Beautiful, responsive interface with dark theme
- ⚡ **Fast Performance**: Optimized React components with lazy loading

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Context API** - State management
- **Axios** - HTTP client
- **Font Awesome** - Icons

### Backend
- **FastAPI** - Modern Python web framework
- **WebSocket** - Real-time communication
- **yt-dlp** - YouTube audio extraction
- **youtube-search-python** - YouTube search
- **aiofiles** - Async file operations

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory and install Node dependencies:
```bash
cd main_frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:8080` (or the port Vite assigns)

3. Build for production:
```bash
npm run build
```

This creates a `dist` folder with the production build.

### Production Deployment

1. Build the React app:
```bash
cd main_frontend
npm run build
```

2. The FastAPI server will automatically serve the React build from the `main_frontend/dist` folder when available.

3. Start the production server:
```bash
python main.py
```

## Project Structure

```
VoxWave/
├── main_frontend/         # React frontend application
│   ├── src/              # React source code
│   │   ├── components/   # React components
│   │   ├── contexts/     # React Context providers
│   │   ├── services/     # API services
│   │   └── main.tsx
│   ├── public/           # Static assets
│   ├── package.json      # Node dependencies
│   ├── vite.config.ts    # Vite configuration
│   └── dist/             # React build output (generated)
├── backend/              # FastAPI backend
│   ├── api/              # API endpoints
│   ├── core/             # Core configuration
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   └── main.py           # FastAPI application
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
└── package.json          # Root package scripts
```

## API Endpoints

- `GET /api/status` - API health check
- `GET /search?q={query}` - Search YouTube
- `GET /play/{video_id}` - Get stream URL for video
- `POST /upload` - Upload audio file
- `GET /library` - Get uploaded songs
- `DELETE /songs/{filename}` - Delete song
- `POST /create-room` - Create listening room
- `GET /room/{room_id}` - Get room info
- `WS /ws/{room_id}/{user_id}` - WebSocket for real-time sync

## Development

### Running Both Servers

You can run both frontend and backend simultaneously:

**Terminal 1 (Backend):**
```bash
python main.py
```

**Terminal 2 (Frontend):**
```bash
cd main_frontend
npm run dev
```

The Vite dev server proxies API requests to the FastAPI backend.

## Performance Optimizations

- React component memoization
- Lazy loading for routes
- Optimized re-renders with Context API
- Debounced search input
- Efficient state management
- WebSocket connection pooling

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
