from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_salt = Column(LargeBinary, nullable=False)
    password_hash = Column(LargeBinary, nullable=False)
    created_at = Column(Integer, nullable=False)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    saved_tracks = relationship("SavedTrack", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(Integer, nullable=False)
    created_at = Column(Integer, nullable=False)

    user = relationship("User", back_populates="sessions")

class SavedTrack(Base):
    __tablename__ = "saved_tracks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    track_id = Column(String, nullable=False)
    source = Column(String, nullable=False)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=True)
    thumbnail = Column(String, nullable=True)
    created_at = Column(Integer, nullable=False)

    user = relationship("User", back_populates="saved_tracks")

    __table_args__ = (
        UniqueConstraint('user_id', 'track_id', 'source', name='uix_user_track_source'),
    )
