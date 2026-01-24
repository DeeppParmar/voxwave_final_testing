import asyncio
import logging
from datetime import datetime
from typing import Dict
from ..core.config import PYTUBEFIX_AVAILABLE
from ..models.schemas import SearchResult, PlayResponse, ErrorResponse

logger = logging.getLogger(__name__)

# Cache for stream URLs
stream_cache = {}
STREAM_CACHE_SECONDS = 180  # 3 minutes (conservative)

search_cache = {}
SEARCH_CACHE_SECONDS = 300

if PYTUBEFIX_AVAILABLE:
    from pytubefix import YouTube, Search
else:
    logger.warning("pytubefix not available")


def _search_videos_sync(q: str):
    # Skip OAuth in production to avoid authentication issues
    # OAuth requires manual completion which isn't possible on headless servers
    try:
        logger.info(f"Starting search for: {q}")
        s = Search(q)
        logger.info(f"Search object created, getting videos...")
        videos = s.videos
        logger.info(f"Found {len(videos)} videos")
        return videos
    except Exception as e:
        logger.error(f"Search failed: {e}")
        logger.error(f"Error type: {type(e)}")
        return []


def _extract_audio_sync(video_id: str):
    yt = YouTube(f"https://www.youtube.com/watch?v={video_id}")
    audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
    if not audio_stream or not audio_stream.url:
        return None
    return {
        'url': audio_stream.url,
        'title': yt.title,
        'length': yt.length,
    }


def create_error_response(error_msg: str, detail: str, suggestions: list = None) -> ErrorResponse:
    if suggestions is None:
        suggestions = []
    return ErrorResponse(error=error_msg, detail=detail, suggestions=suggestions)


def _parse_duration_seconds(value):
    if value is None:
        return 0
    if isinstance(value, (int, float)):
        return int(value)
    if not isinstance(value, str):
        return 0
    parts = value.strip().split(':')
    if not parts or any(not p.isdigit() for p in parts):
        return 0
    nums = [int(p) for p in parts]
    if len(nums) == 3:
        return nums[0] * 3600 + nums[1] * 60 + nums[2]
    if len(nums) == 2:
        return nums[0] * 60 + nums[1]
    return nums[0]


async def search_youtube_service(q: str):
    """Enhanced YouTube search using pytubefix"""
    if not PYTUBEFIX_AVAILABLE:
        raise Exception("YouTube search not available - pytubefix is required")

    # Validate query
    if not q or not q.strip():
        raise ValueError("Search query cannot be empty")

    try:
        cache_key = q.strip().lower()
        cached = search_cache.get(cache_key)
        if cached and (datetime.now() - cached['timestamp']).total_seconds() < SEARCH_CACHE_SECONDS:
            return cached['data']

        results = await asyncio.to_thread(_search_videos_sync, q)
        logger.info(f"Search returned {len(results) if results else 0} raw results")
            
        if not results:
            logger.warning("No results found from YouTube search")
            return []
            
        search_results = []
        
        for i, video in enumerate(results):
            if len(search_results) >= 20:
                break
                
            try:
                logger.info(f"Processing video {i+1}: {getattr(video, 'title', 'No title')}")
                
                # Basic validation
                if not video.video_id:
                    logger.warning(f"Skipping video {i+1}: no video_id")
                    continue
                
                duration = video.length
                if duration < 60: # Skip shorts
                    logger.warning(f"Skipping video {i+1}: too short ({duration}s)")
                    continue

                minutes = duration // 60
                seconds = duration % 60
                duration_str = f"{minutes}:{seconds:02d}"

                search_result = SearchResult(
                    id=video.video_id,
                    title=video.title,
                    channel=video.author,
                    duration=duration_str,
                    thumbnail=video.thumbnail_url,
                    url=f"https://www.youtube.com/watch?v={video.video_id}"
                )
                search_results.append(search_result)
                logger.info(f"Added video {i+1} to results")
                
            except Exception as e:
                logger.error(f"Error processing video {i+1}: {e}")
                continue

        logger.info(f"Final search results: {len(search_results)} videos")
        search_cache[cache_key] = {
            'data': search_results,
            'timestamp': datetime.now()
        }
        
        return search_results
        
    except Exception as e:
        raise Exception(f"Search failed: {str(e)}")


async def get_stream_url_service(video_id: str):
    """Get stream URL using pytubefix"""
    if not PYTUBEFIX_AVAILABLE:
        return create_error_response(
            "Service Unavailable",
            "pytubefix not available",
            ["Install pytubefix with: pip install pytubefix"]
        )

    # Validate video_id
    if not video_id or len(video_id) != 11:
        return create_error_response(
            "Invalid Video ID",
            "YouTube video IDs must be exactly 11 characters",
            []
        )

    # Check cache
    cache_key = f"{video_id}_{datetime.now().strftime('%Y%m%d%H%M')}"
    
    if cache_key in stream_cache:
        cached_data = stream_cache[cache_key]
        cache_age = (datetime.now() - cached_data['timestamp']).total_seconds()
        
        if cache_age < STREAM_CACHE_SECONDS:
            logger.info(f"Using cached stream URL for {video_id} (age: {cache_age:.0f}s)")
            return PlayResponse(**cached_data['data'])

    try:
        extracted = await asyncio.to_thread(_extract_audio_sync, video_id)
        if not extracted:
            return create_error_response(
                "Stream Not Found",
                "Could not find a valid audio stream",
                ["Video may be unavailable or region locked"]
            )

        play_response = PlayResponse(
            stream_url=extracted['url'],
            title=extracted['title'],
            duration=f"{extracted['length']}s",
            stream_headers=None
        )
        
        stream_cache[cache_key] = {
            'data': play_response.dict(),
            'timestamp': datetime.now()
        }
        
        return play_response
                
    except Exception as e:
        return create_error_response(
            "Stream Extraction Failed",
            str(e)[:200],
            [
                "Video may be region-restricted",
                "Try a different video"
            ]
        )