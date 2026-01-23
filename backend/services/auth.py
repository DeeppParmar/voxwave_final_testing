import hashlib
import hmac
import os
import secrets
import time
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..models.sql_models import User, Session as DbSession, SavedTrack
from ..core.database import engine, Base

@dataclass(frozen=True)
class AuthUser:
    id: int
    username: str

def init_auth_db() -> None:
    # SQLALCHEMY creates tables
    Base.metadata.create_all(bind=engine)

def _pbkdf2_hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)

def _normalize_username(username: str) -> str:
    return username.strip().lower()

def create_user(db: Session, username: str, password: str) -> AuthUser:
    username_n = _normalize_username(username)
    if not username_n or len(username_n) < 3:
        raise ValueError("Username must be at least 3 characters")
    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters")

    salt = os.urandom(16)
    pw_hash = _pbkdf2_hash(password, salt)
    now = int(time.time())

    new_user = User(
        username=username_n,
        password_salt=salt,
        password_hash=pw_hash,
        created_at=now
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise ValueError("Username already exists")

    return AuthUser(id=new_user.id, username=new_user.username)

def verify_credentials(db: Session, username: str, password: str) -> Optional[AuthUser]:
    username_n = _normalize_username(username)
    if not username_n or not password:
        return None

    user = db.query(User).filter(User.username == username_n).first()
    if not user:
        return None

    expected = user.password_hash
    actual = _pbkdf2_hash(password, user.password_salt)

    if not hmac.compare_digest(expected, actual):
        return None

    return AuthUser(id=user.id, username=user.username)

def create_session(db: Session, user_id: int, ttl_seconds: int = 60 * 60 * 24 * 30) -> str:
    token = secrets.token_urlsafe(48)
    now = int(time.time())
    expires_at = now + ttl_seconds

    session = DbSession(
        token=token,
        user_id=user_id,
        expires_at=expires_at,
        created_at=now
    )
    db.add(session)
    db.commit()

    return token

def delete_session(db: Session, token: str) -> None:
    db.query(DbSession).filter(DbSession.token == token).delete()
    db.commit()

def get_user_by_token(db: Session, token: str) -> Optional[AuthUser]:
    if not token:
        return None

    now = int(time.time())
    
    # We join explicitly or just query session
    # SQLAlchemy relationships allow session.user access
    db_session = db.query(DbSession).filter(DbSession.token == token).first()
    
    if not db_session:
        return None
    
    if db_session.expires_at < now:
        db.delete(db_session)
        db.commit()
        return None
        
    return AuthUser(id=db_session.user.id, username=db_session.user.username)


def list_saved_tracks(db: Session, user_id: int) -> List[dict]:
    tracks = db.query(SavedTrack).filter(SavedTrack.user_id == user_id).order_by(SavedTrack.created_at.desc()).all()
    return [
        {
            'track_id': t.track_id,
            'source': t.source,
            'title': t.title,
            'artist': t.artist,
            'thumbnail': t.thumbnail,
            'created_at': t.created_at,
        }
        for t in tracks
    ]

def save_track(
    db: Session,
    user_id: int,
    *,
    track_id: str,
    source: str,
    title: str,
    artist: Optional[str] = None,
    thumbnail: Optional[str] = None,
) -> None:
    track_id = (track_id or '').strip()
    source = (source or '').strip()
    title = (title or '').strip()
    if not track_id or not source or not title:
        raise ValueError('track_id, source and title are required')
    if source not in ('youtube', 'local'):
        raise ValueError('Invalid source')

    now = int(time.time())
    
    # Check for existing
    existing = db.query(SavedTrack).filter(
        SavedTrack.user_id == user_id,
        SavedTrack.track_id == track_id,
        SavedTrack.source == source
    ).first()
    
    if existing:
        existing.title = title
        existing.artist = artist
        existing.thumbnail = thumbnail
    else:
        new_track = SavedTrack(
            user_id=user_id,
            track_id=track_id,
            source=source,
            title=title,
            artist=artist,
            thumbnail=thumbnail,
            created_at=now
        )
        db.add(new_track)
    
    db.commit()

def remove_track(db: Session, user_id: int, *, track_id: str, source: str) -> None:
    track_id = (track_id or '').strip()
    source = (source or '').strip()
    if not track_id or not source:
        raise ValueError('track_id and source are required')

    db.query(SavedTrack).filter(
        SavedTrack.user_id == user_id,
        SavedTrack.track_id == track_id,
        SavedTrack.source == source
    ).delete()
    db.commit()
