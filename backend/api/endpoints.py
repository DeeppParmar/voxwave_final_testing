from fastapi import APIRouter, File, UploadFile, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import shutil
import uuid
import aiofiles
import json
from pathlib import Path
import logging
from datetime import datetime
import httpx
import asyncio
import os

from ..core.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, YOUTUBE_USER_AGENT, DB_PATH
from ..models.schemas import UploadResponse, SearchResponse, HealthResponse, ErrorResponse, AuthRequest, AuthResponse, MeResponse, SavedTracksResponse, SaveTrackRequest
from ..services.youtube import search_youtube_service, get_stream_url_service, create_error_response
from ..services.rooms import active_rooms, room_connections, broadcast_to_room, handle_host_message, handle_listener_message
from ..services.auth import create_user, verify_credentials, create_session, delete_session, get_user_by_token, list_saved_tracks, save_track, remove_track

router = APIRouter()
logger = logging.getLogger(__name__)

def _get_bearer_token(request: Request) -> str:
    auth = request.headers.get('authorization') or ''
    parts = auth.split(' ', 1)
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1].strip()
    return ''

def _require_user(request: Request):
    token = _get_bearer_token(request)
    user = get_user_by_token(DB_PATH, token)
    if not user:
        raise HTTPException(status_code=401, detail='Unauthorized')
    return user

@router.get("/health", response_model=HealthResponse)
async def health_check():
    from ..core.config import YOUTUBE_SEARCH_AVAILABLE, PYTUBEFIX_AVAILABLE
    return HealthResponse(
        status="healthy", 
        message="API is operational",
        youtube_available=YOUTUBE_SEARCH_AVAILABLE,
        pytubefix_available=PYTUBEFIX_AVAILABLE
    )

@router.get("/api/status")
async def api_status():
    from ..core.config import YOUTUBE_SEARCH_AVAILABLE, PYTUBEFIX_AVAILABLE
    return {
        "status": "success",
        "message": "VoxWave API is running!",
        "youtube_available": YOUTUBE_SEARCH_AVAILABLE,
        "pytubefix_available": PYTUBEFIX_AVAILABLE
    }

@router.post("/auth/register", response_model=AuthResponse)
async def register(payload: AuthRequest):
    try:
        user = create_user(DB_PATH, payload.username, payload.password)
        token = create_session(DB_PATH, user.id)
        return AuthResponse(token=token, username=user.username)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/login", response_model=AuthResponse)
async def login(payload: AuthRequest):
    user = verify_credentials(DB_PATH, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid username or password')
    token = create_session(DB_PATH, user.id)
    return AuthResponse(token=token, username=user.username)

@router.post("/auth/logout")
async def logout(request: Request):
    token = _get_bearer_token(request)
    if token:
        delete_session(DB_PATH, token)
    return {"ok": True}

@router.get("/me", response_model=MeResponse)
async def me(request: Request):
    user = _require_user(request)
    return MeResponse(id=user.id, username=user.username)

@router.get("/me/library", response_model=SavedTracksResponse)
async def get_my_library(request: Request):
    user = _require_user(request)
    tracks = list_saved_tracks(DB_PATH, user.id)
    return SavedTracksResponse(tracks=tracks)

@router.post("/me/library")
async def add_to_my_library(request: Request, payload: SaveTrackRequest):
    user = _require_user(request)
    try:
        save_track(
            DB_PATH,
            user.id,
            track_id=payload.track_id,
            source=payload.source,
            title=payload.title,
            artist=payload.artist,
            thumbnail=payload.thumbnail,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}

@router.delete("/me/library")
async def remove_from_my_library(request: Request, track_id: str = Query(...), source: str = Query(...)):
    user = _require_user(request)
    try:
        remove_track(DB_PATH, user.id, track_id=track_id, source=source)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}

@router.get("/songs/{filename}")
async def serve_song(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
        }
    )

@router.post("/upload", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not supported")
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
        
    return UploadResponse(
        filename=unique_filename,
        original_name=file.filename,
        size=len(content),
        message="File uploaded successfully"
    )

@router.get("/search", response_model=SearchResponse)
async def search_youtube(q: str = Query(..., description="Search query", min_length=1)):
    """Search YouTube videos"""
    try:
        results = await search_youtube_service(q.strip())
        return SearchResponse(results=results, total=len(results))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Search failed for query '{q}': {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/play/{video_id}")
async def get_stream_url(video_id: str):
    """Fixed play endpoint with better error handling"""
    if not video_id or len(video_id) != 11:
        return JSONResponse(
            status_code=400, 
            content=create_error_response(
                "Invalid Video ID",
                "YouTube video IDs must be exactly 11 characters",
                ["Check the video URL"]
            ).dict()
        )
    
    result = await get_stream_url_service(video_id)
    if isinstance(result, ErrorResponse):
        return JSONResponse(status_code=400, content=result.dict())
    return result

@router.get("/stream/{video_id}")
async def stream_audio(video_id: str, request: Request):
    """Fixed streaming endpoint with proper error handling"""
    
    # Validate video ID
    if not video_id or len(video_id) != 11:
        return JSONResponse(
            status_code=400,
            content=create_error_response(
                "Invalid Video ID",
                "YouTube video IDs must be exactly 11 characters",
                []
            ).dict()
        )
    
    # Get fresh stream URL
    result = await get_stream_url_service(video_id)
    if isinstance(result, ErrorResponse):
        return JSONResponse(status_code=400, content=result.dict())

    upstream_url = result.stream_url
    extra_headers = result.stream_headers or {}

    range_header = request.headers.get('range')
    
    client_headers = {
        'User-Agent': YOUTUBE_USER_AGENT,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }
    
    for k, v in extra_headers.items():
        if k.lower() not in ['range', 'host']:
            client_headers[k] = v
    
    if range_header:
        client_headers['Range'] = range_header
    else:
        client_headers['Range'] = 'bytes=0-'

    client = httpx.AsyncClient(
        follow_redirects=True, 
        timeout=httpx.Timeout(60.0, connect=10.0),
        limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
    )

    stream_cm = None
    resp = None

    try:
        stream_cm = client.stream('GET', upstream_url, headers=client_headers)
        resp = await stream_cm.__aenter__()

        if resp.status_code >= 400:
            error_body = ""
            try:
                error_bytes = await asyncio.wait_for(resp.aread(), timeout=2.0)
                error_body = error_bytes[:300].decode('utf-8', errors='ignore')
            except asyncio.TimeoutError:
                error_body = "Timeout reading error response"
            except Exception as e:
                error_body = f"Error reading response: {e}"

            logger.error(f"Upstream error {resp.status_code} for {video_id}: {error_body}")

            try:
                await stream_cm.__aexit__(None, None, None)
            finally:
                await client.aclose()

            return JSONResponse(
                status_code=502,
                content=create_error_response(
                    'Upstream Stream Failed',
                    f'YouTube returned {resp.status_code}',
                    [
                        'Stream URL may have expired',
                        'Try refreshing the page',
                        'Video may be region-restricted'
                    ]
                ).dict()
            )

        passthrough_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
            'Cache-Control': 'no-cache',
        }

        for h in ['accept-ranges', 'content-range', 'content-length', 'content-type']:
            if h in resp.headers:
                passthrough_headers[h] = resp.headers[h]

        media_type = resp.headers.get('content-type') or 'audio/mp4'

        async def stream_bytes():
            try:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk
            except Exception as e:
                logger.error(f"Error during streaming for {video_id}: {e}")
                raise
            finally:
                try:
                    if stream_cm is not None:
                        await stream_cm.__aexit__(None, None, None)
                finally:
                    try:
                        await client.aclose()
                    except Exception as e:
                        logger.warning(f"Error closing client: {e}")

        return StreamingResponse(
            stream_bytes(),
            status_code=resp.status_code,
            media_type=media_type,
            headers=passthrough_headers,
        )

    except httpx.TimeoutException as e:
        logger.error(f"Timeout streaming {video_id}: {e}")
        try:
            if stream_cm is not None:
                await stream_cm.__aexit__(None, None, None)
        finally:
            try:
                await client.aclose()
            except Exception:
                pass
        
        return JSONResponse(
            status_code=504,
            content=create_error_response(
                'Stream Timeout',
                'Connection to YouTube timed out',
                ['Check your internet connection', 'Try again']
            ).dict()
        )
    
    except Exception as e:
        logger.error(f"Unexpected error streaming {video_id}: {e}")
        try:
            if stream_cm is not None:
                await stream_cm.__aexit__(None, None, None)
        finally:
            try:
                await client.aclose()
            except Exception:
                pass
        
        return JSONResponse(
            status_code=500,
            content=create_error_response(
                'Stream Failed',
                str(e)[:150],
                ['Unexpected error', 'Try refreshing']
            ).dict()
        )
        
@router.get("/library")
async def get_library():
    try:
        songs = []
        if UPLOAD_DIR.exists():
            for file_path in UPLOAD_DIR.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
                    stat = file_path.stat()
                    songs.append({
                        'id': file_path.name,
                        'filename': file_path.name,
                        'original_name': file_path.stem,
                        'size': stat.st_size,
                        'modified': stat.st_mtime,
                        'url': f'/songs/{file_path.name}',
                        'source': 'local'
                    })
        songs.sort(key=lambda x: x['modified'], reverse=True)
        return {'songs': songs, 'total': len(songs)}
    except Exception as e:
        logger.error(f"Library error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get library")

@router.delete("/songs/{filename}")
async def delete_song(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    try:
        file_path.unlink()
        return {"message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete file")

# Room endpoints
@router.post("/create-room")
async def create_room(request: Request):
    import secrets

    user = _require_user(request)
    room_id = secrets.token_urlsafe(8)
    active_rooms[room_id] = {
        'host_id': user.username,
        'current_song': None,
        'is_playing': False,
        'current_time': 0.0,
        'last_update': datetime.now().isoformat(),
        'listener_count': 0
    }
    room_connections[room_id] = []

    frontend_base = (
        os.environ.get("FRONTEND_BASE_URL")
        or request.headers.get("origin")
        or str(request.base_url).rstrip("/")
    ).rstrip("/")
    join_url = f"{frontend_base}/rooms?room={room_id}"
    return {
        'room_id': room_id,
        'host_id': active_rooms[room_id]['host_id'],
        'join_url': join_url,
        'message': 'Room created successfully'
    }

@router.get("/room/{room_id}")
async def get_room_info(room_id: str):
    if room_id not in active_rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    room_data = active_rooms[room_id].copy()
    room_data['listener_count'] = len(room_connections.get(room_id, []))
    return room_data

@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    if room_id not in active_rooms:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    
    room_connections[room_id].append(websocket)
    active_rooms[room_id]['listener_count'] = len(room_connections[room_id])
    
    await websocket.send_text(json.dumps({
        'type': 'room_state',
        'data': active_rooms[room_id],
        'is_host': user_id == active_rooms[room_id]['host_id']
    }))
    
    await broadcast_to_room(room_id, {
        'type': 'user_joined',
        'user_id': user_id,
        'listener_count': active_rooms[room_id]['listener_count']
    }, exclude=websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if user_id == active_rooms[room_id]['host_id']:
                await handle_host_message(room_id, message, websocket)
            else:
                await handle_listener_message(room_id, message, websocket)
    except WebSocketDisconnect:
        if room_id in room_connections:
            room_connections[room_id] = [c for c in room_connections[room_id] if c != websocket]
            active_rooms[room_id]['listener_count'] = len(room_connections[room_id])
            await broadcast_to_room(room_id, {
                'type': 'user_left',
                'user_id': user_id,
                'listener_count': active_rooms[room_id]['listener_count']
            })
            if len(room_connections[room_id]) == 0:
                del active_rooms[room_id]
                del room_connections[room_id]