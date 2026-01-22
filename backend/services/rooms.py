from datetime import datetime
from fastapi import WebSocket
import json
from typing import Dict, List
from ..models.schemas import RoomInfo

# In-memory storage
active_rooms: Dict[str, Dict] = {}
room_connections: Dict[str, List[WebSocket]] = {}

async def broadcast_to_room(room_id: str, message: dict, exclude: WebSocket = None):
    if room_id in room_connections:
        for connection in room_connections[room_id]:
            if connection != exclude:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    # Connection might be closed
                    pass

async def handle_host_message(room_id: str, message: dict, websocket: WebSocket):
    msg_type = message.get('type')
    
    if msg_type == 'play':
        active_rooms[room_id]['is_playing'] = True
        active_rooms[room_id]['current_time'] = message.get('current_time', 0)
        active_rooms[room_id]['last_update'] = datetime.now().isoformat()
        
    elif msg_type == 'pause':
        active_rooms[room_id]['is_playing'] = False
        active_rooms[room_id]['current_time'] = message.get('current_time', 0)
        active_rooms[room_id]['last_update'] = datetime.now().isoformat()
        
    elif msg_type == 'seek':
        active_rooms[room_id]['current_time'] = message.get('current_time', 0)
        active_rooms[room_id]['last_update'] = datetime.now().isoformat()
        
    elif msg_type == 'song_change':
        active_rooms[room_id]['current_song'] = message.get('song')
        active_rooms[room_id]['current_time'] = 0
        active_rooms[room_id]['is_playing'] = True
        active_rooms[room_id]['last_update'] = datetime.now().isoformat()

    # Broadcast update to all listeners
    await broadcast_to_room(room_id, {
        'type': msg_type,
        'data': active_rooms[room_id],
        'timestamp': datetime.now().isoformat()
    }, exclude=websocket)

async def handle_listener_message(room_id: str, message: dict, websocket: WebSocket):
    # Listeners currently don't control playback, but might send other events
    pass
