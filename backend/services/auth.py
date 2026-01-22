import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional


@dataclass(frozen=True)
class AuthUser:
    id: int
    username: str


def _db_connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_auth_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with _db_connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_salt BLOB NOT NULL,
                password_hash BLOB NOT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS saved_tracks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                track_id TEXT NOT NULL,
                source TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT,
                thumbnail TEXT,
                created_at INTEGER NOT NULL,
                UNIQUE(user_id, track_id, source),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )


def _pbkdf2_hash(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)


def _normalize_username(username: str) -> str:
    return username.strip().lower()


def create_user(db_path: Path, username: str, password: str) -> AuthUser:
    username_n = _normalize_username(username)
    if not username_n or len(username_n) < 3:
        raise ValueError("Username must be at least 3 characters")
    if not password or len(password) < 4:
        raise ValueError("Password must be at least 4 characters")

    salt = os.urandom(16)
    pw_hash = _pbkdf2_hash(password, salt)
    now = int(time.time())

    with _db_connect(db_path) as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users(username, password_salt, password_hash, created_at) VALUES(?,?,?,?)",
                (username_n, salt, pw_hash, now),
            )
        except sqlite3.IntegrityError:
            raise ValueError("Username already exists")
        user_id = int(cur.lastrowid)

    return AuthUser(id=user_id, username=username_n)


def verify_credentials(db_path: Path, username: str, password: str) -> Optional[AuthUser]:
    username_n = _normalize_username(username)
    if not username_n or not password:
        return None

    with _db_connect(db_path) as conn:
        row = conn.execute(
            "SELECT id, username, password_salt, password_hash FROM users WHERE username = ?",
            (username_n,),
        ).fetchone()

    if not row:
        return None

    salt = row["password_salt"]
    expected = row["password_hash"]
    actual = _pbkdf2_hash(password, salt)

    if not hmac.compare_digest(expected, actual):
        return None

    return AuthUser(id=int(row["id"]), username=row["username"])


def create_session(db_path: Path, user_id: int, ttl_seconds: int = 60 * 60 * 24 * 30) -> str:
    token = secrets.token_urlsafe(48)
    now = int(time.time())
    expires_at = now + ttl_seconds

    with _db_connect(db_path) as conn:
        conn.execute(
            "INSERT INTO sessions(token, user_id, expires_at, created_at) VALUES(?,?,?,?)",
            (token, user_id, expires_at, now),
        )

    return token


def delete_session(db_path: Path, token: str) -> None:
    with _db_connect(db_path) as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


def get_user_by_token(db_path: Path, token: str) -> Optional[AuthUser]:
    if not token:
        return None

    now = int(time.time())

    with _db_connect(db_path) as conn:
        row = conn.execute(
            """
            SELECT u.id, u.username, s.expires_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()

        if not row:
            return None

        if int(row["expires_at"]) < now:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            return None

        return AuthUser(id=int(row["id"]), username=row["username"])


def list_saved_tracks(db_path: Path, user_id: int) -> List[dict]:
    with _db_connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT track_id, source, title, artist, thumbnail, created_at
            FROM saved_tracks
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()

    return [
        {
            'track_id': r['track_id'],
            'source': r['source'],
            'title': r['title'],
            'artist': r['artist'],
            'thumbnail': r['thumbnail'],
            'created_at': r['created_at'],
        }
        for r in rows
    ]


def save_track(
    db_path: Path,
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
    with _db_connect(db_path) as conn:
        conn.execute(
            """
            INSERT INTO saved_tracks(user_id, track_id, source, title, artist, thumbnail, created_at)
            VALUES(?,?,?,?,?,?,?)
            ON CONFLICT(user_id, track_id, source) DO UPDATE SET
                title=excluded.title,
                artist=excluded.artist,
                thumbnail=excluded.thumbnail
            """,
            (user_id, track_id, source, title, artist, thumbnail, now),
        )


def remove_track(db_path: Path, user_id: int, *, track_id: str, source: str) -> None:
    track_id = (track_id or '').strip()
    source = (source or '').strip()
    if not track_id or not source:
        raise ValueError('track_id and source are required')

    with _db_connect(db_path) as conn:
        conn.execute(
            "DELETE FROM saved_tracks WHERE user_id = ? AND track_id = ? AND source = ?",
            (user_id, track_id, source),
        )
