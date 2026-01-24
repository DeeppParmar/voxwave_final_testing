import os
from pathlib import Path
from datetime import timedelta
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Directory setup
# We assume this config is imported from backend/core/config.py, so we go up two levels to root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
STATIC_DIR = ROOT_DIR / "main_frontend" / "public"  # Use main_frontend public directory
CACHE_DIR = ROOT_DIR / "cache"
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "voxwave.db"

# Database Config
# If DATABASE_URL is not set, fallback to local SQLite.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    # SQLALCHEMY requires 'sqlite:///' prefix
    DATABASE_URL = f"sqlite:///{DB_PATH}" 
elif DATABASE_URL.startswith("postgres://"):
    # SQLAlchemy 1.4+ requires postgresql://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
CACHE_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# Constants
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
CACHE_DURATION = timedelta(hours=1)
PORT = int(os.environ.get("PORT", 8000))
YOUTUBE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

# Dependency Checks
try:
    from youtubesearchpython import VideosSearch
    YOUTUBE_SEARCH_AVAILABLE = False  # Disabled due to httpx compatibility issues
    logger.warning("youtube-search-python disabled due to compatibility issues. Using pytubefix for search instead.")
except ImportError:
    YOUTUBE_SEARCH_AVAILABLE = False
    logger.warning("youtube-search-python not available. Using pytubefix for search instead.")

try:
    import pytubefix
    PYTUBEFIX_AVAILABLE = True
except ImportError:
    PYTUBEFIX_AVAILABLE = False
    logger.warning("pytubefix not available. Install with: pip install pytubefix")

try:
    from fastapi.templating import Jinja2Templates
    TEMPLATES_AVAILABLE = False  # Templates no longer needed with React frontend
    templates = None
except ImportError:
    TEMPLATES_AVAILABLE = False
    templates = None
