from pydantic import BaseModel
from typing import List, Optional, Dict

class SearchResult(BaseModel):
    id: str
    title: str
    channel: str
    duration: str
    thumbnail: str
    url: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int

class PlayResponse(BaseModel):
    stream_url: str
    title: str
    duration: Optional[str] = None
    stream_headers: Optional[Dict[str, str]] = None
    error: Optional[str] = None

class UploadResponse(BaseModel):
    filename: str
    original_name: str
    size: int
    message: str

class HealthResponse(BaseModel):
    status: str
    message: str
    youtube_available: bool
    pytubefix_available: bool

class ErrorResponse(BaseModel):
    error: str
    detail: str
    suggestions: List[str] = []

class AuthRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    token: str
    username: str

class MeResponse(BaseModel):
    id: int
    username: str

class SavedTrack(BaseModel):
    track_id: str
    source: str
    title: str
    artist: Optional[str] = None
    thumbnail: Optional[str] = None
    created_at: int

class SavedTracksResponse(BaseModel):
    tracks: List[SavedTrack]

class SaveTrackRequest(BaseModel):
    track_id: str
    source: str
    title: str
    artist: Optional[str] = None
    thumbnail: Optional[str] = None

class RoomInfo(BaseModel):
    room_id: str
    host_id: str
    current_song: Optional[dict] = None
    is_playing: bool = False
    current_time: float = 0.0
    last_update: str
    listener_count: int = 0

class SyncMessage(BaseModel):
    type: str  # 'play', 'pause', 'seek', 'song_change', 'join', 'leave'
    room_id: str
    user_id: str
    data: Optional[dict] = None
    timestamp: str
